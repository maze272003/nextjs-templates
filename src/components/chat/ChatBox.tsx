'use client';

import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { Socket } from 'socket.io-client';
import { Send, ArrowLeft, MessagesSquare, Paperclip, File as FileIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: number | string;
  content: string | null;
  sender_id: number;
  username: string;
  created_at: string;
  profile_picture_url: string | null;
  message_type: 'text' | 'image' | 'video' | 'file';
  file_url: string | null;
  isOptimistic?: boolean;
  uploadProgress?: 'pending' | 'uploading' | 'failed';
  localFileUrl?: string;
}

interface Profile {
  id: number;
  first_name: string;
  profile_picture_url: string | null;
}

interface SelectedUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

interface ChatBoxProps {
  socket: Socket;
  currentUser: Profile | null;
  selectedUser: SelectedUser | null;
  onBack: () => void;
}

export default function ChatBox({ socket, currentUser, selectedUser, onBack }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser || !selectedUser) return;
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/messages?userId1=${currentUser.id}&userId2=${selectedUser.id}`);
        const history: Message[] = await res.json();
        setChatLog(history);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        setChatLog([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (selectedUser && currentUser) {
      setChatLog([]);
      socket.emit('join-private-room', currentUser.id, selectedUser.id);
      fetchHistory();
    }

    const handleNewMessage = (newMessageFromServer: Message) => {
      if (!currentUser || !selectedUser) return;

      // Logic to replace the optimistic message with the real one from the server
      if (Number(newMessageFromServer.sender_id) === Number(currentUser.id)) {
        setChatLog(prevLog =>
          prevLog.map(msg =>
            (msg.isOptimistic &&
              (msg.content === newMessageFromServer.content ||
                (msg.localFileUrl && newMessageFromServer.file_url)))
            ? newMessageFromServer
            : msg
          )
        );
      } else if (Number(newMessageFromServer.sender_id) === Number(selectedUser.id)) {
        // Add incoming message from the other user
        setChatLog(prevLog => [...prevLog, newMessageFromServer]);
      }
    };

    socket.on('new-private-message', handleNewMessage);
    return () => {
      socket.off('new-private-message', handleNewMessage);
    };
  }, [selectedUser, currentUser, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentUser && selectedUser) {
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message,
        sender_id: currentUser.id,
        username: currentUser.first_name,
        created_at: new Date().toISOString(),
        profile_picture_url: currentUser.profile_picture_url,
        message_type: 'text',
        file_url: null,
        isOptimistic: true,
      };
      setChatLog(prev => [...prev, optimisticMessage]);

      const messageData = {
        content: message,
        senderId: currentUser.id,
        receiverId: selectedUser.id,
      };
      socket.emit('private-message', messageData);
      setMessage('');
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !selectedUser) return;

    const tempId = `temp-file-${Date.now()}`;
    const localFileUrl = URL.createObjectURL(file);

    const optimisticMessage: Message = {
      id: tempId,
      content: file.name,
      sender_id: currentUser.id,
      username: currentUser.first_name,
      created_at: new Date().toISOString(),
      profile_picture_url: currentUser.profile_picture_url,
      message_type: getContentType(file.name),
      file_url: null,
      isOptimistic: true,
      uploadProgress: 'pending',
      localFileUrl,
    };

    setChatLog(prev => [...prev, optimisticMessage]);
    setChatLog(prev => prev.map(m => m.id === tempId ? { ...m, uploadProgress: 'uploading' } : m));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', String(currentUser.id));
    formData.append('receiverId', String(selectedUser.id));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const savedMessage: Message = await response.json();
      socket.emit('private-file-message', savedMessage);
      // Replace the optimistic message with the final one from the server
      setChatLog(prev => prev.map(m => m.id === tempId ? savedMessage : m));
    } catch (error) {
      console.error("File upload failed:", error);
      // Mark the upload as failed in the UI
      setChatLog(prev => prev.map(m => m.id === tempId ? { ...m, uploadProgress: 'failed' } : m));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getContentType = (fileName: string): 'image' | 'video' | 'file' => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    return 'file';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b font-semibold text-gray-800 shadow-sm flex items-center space-x-3">
        <button onClick={onBack} className="md:hidden p-1 -ml-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={22} />
        </button>
        {selectedUser?.profile_picture_url ? (
          <Image
            src={selectedUser.profile_picture_url}
            alt={selectedUser.first_name}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
            {selectedUser?.first_name?.[0]}
          </div>
        )}
        <span className="truncate">{selectedUser?.first_name} {selectedUser?.last_name}</span>
      </div>

      {/* Chat Log */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
        {loadingHistory ? (
          <div className="text-center text-gray-500">Loading history...</div>
        ) : chatLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessagesSquare size={60} className="mb-4" />
            <h3 className="text-xl font-semibold">No messages yet</h3>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        ) : (
          chatLog.map((msg, idx) => {
            const isSender = Number(msg.sender_id) === Number(currentUser?.id);
            return (
              <div key={`${msg.id}-${idx}`} className={`flex items-end gap-2 mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
                {!isSender && (
                  <div className="flex-shrink-0">
                    {msg.profile_picture_url ? (
                      <Image
                        src={msg.profile_picture_url}
                        alt={msg.username}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                        {msg.username?.[0] || ''}
                      </div>
                    )}
                  </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[70%] ${isSender ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-black rounded-bl-none'}`}>
                  {!isSender && <strong className="block text-xs text-blue-700 mb-1">{msg.username}</strong>}

                  {/* Image Message */}
                  {msg.message_type === 'image' && (
                    <div className="relative">
                      <Image
                        src={(msg.isOptimistic ? msg.localFileUrl : msg.file_url) || ''}
                        alt={msg.content || 'Uploaded image'}
                        width={200}
                        height={200}
                        className="rounded-lg w-auto h-auto"
                      />
                      {msg.uploadProgress === 'uploading' && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {msg.uploadProgress === 'failed' && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center rounded-lg text-white text-xs font-bold">
                          Failed
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Message */}
                  {msg.message_type === 'file' && msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30">
                      <FileIcon className="w-6 h-6 flex-shrink-0" />
                      <span className="text-sm break-all">{msg.content}</span>
                    </a>
                  )}

                  {/* Text Message */}
                  {msg.message_type === 'text' && (
                    <p className="text-sm break-all">{msg.content}</p>
                  )}

                  <p className={`text-xs mt-1 text-right opacity-70 ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleTextSubmit} className="p-3 border-t flex items-center bg-white gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600">
          <Paperclip size={22} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Type your message..."
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}