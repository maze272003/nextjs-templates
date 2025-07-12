'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send, MessageSquare, ArrowLeft, MessagesSquare } from 'lucide-react';

// Interfaces for data shapes
interface Message {
    id: number | string;
    content: string;
    sender_id: number;
    username: string;
    created_at: string;
    profile_picture_url: string | null;
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

// Component props interface
interface ChatBoxProps {
    socket: Socket;
    currentUser: Profile | null;
    selectedUser: SelectedUser | null;
    onBack: () => void; // Function to go back to the user list on mobile
}

export default function ChatBox({ socket, currentUser, selectedUser, onBack }: ChatBoxProps) {
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState<Message[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

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
                setChatLog([]); // Ensure chat is empty on error
            } finally {
                setLoadingHistory(false);
            }
        };

        if (selectedUser && currentUser) {
            setChatLog([]); // Clear previous chat
            socket.emit('join-private-room', currentUser.id, selectedUser.id);
            fetchHistory();
        }

        const handleNewMessage = (newMessageFromServer: Message) => {
            if (!currentUser || !selectedUser) return;
            
            if (Number(newMessageFromServer.sender_id) === Number(currentUser.id)) {
                setChatLog(prevLog => 
                    prevLog.map(msg => 
                        typeof msg.id === 'string' && msg.content === newMessageFromServer.content 
                        ? newMessageFromServer 
                        : msg
                    )
                );
            } else if (Number(newMessageFromServer.sender_id) === Number(selectedUser.id)) {
                setChatLog((prevLog) => [...prevLog, newMessageFromServer]);
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (message.trim() && currentUser && selectedUser) {
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                content: message,
                sender_id: currentUser.id,
                username: currentUser.first_name,
                created_at: new Date().toISOString(),
                profile_picture_url: currentUser.profile_picture_url,
            };
            setChatLog(prevLog => [...prevLog, optimisticMessage]);
            const messageData = {
                content: message,
                senderId: currentUser.id,
                receiverId: selectedUser.id,
            };
            socket.emit('private-message', messageData);
            setMessage('');
        }
    };

    if (!selectedUser) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400 bg-white">
                <MessageSquare size={64} className="mb-4" />
                <h3 className="text-xl font-semibold">Select a conversation</h3>
                <p className="text-sm">Choose someone from your contacts to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b font-semibold text-gray-800 shadow-sm flex items-center space-x-3">
                <button onClick={onBack} className="md:hidden p-1 -ml-1 text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={22} />
                </button>
                {selectedUser.profile_picture_url ? (
                    <img src={selectedUser.profile_picture_url} alt={selectedUser.first_name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                        {selectedUser.first_name?.[0] || ''}
                    </div>
                )}
                <span className="truncate">{selectedUser.first_name} {selectedUser.last_name}</span>
            </div>
            
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
                                            <img src={msg.profile_picture_url} alt={msg.username} className="w-8 h-8 rounded-full object-cover"/>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                                                {msg.username?.[0] || ''}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={`p-3 rounded-2xl max-w-[70%] ${
                                    isSender 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-gray-200 text-black rounded-bl-none'
                                }`}>
                                    {!isSender && <strong className="block text-xs text-blue-700 mb-1">{msg.username}</strong>}
                                    <p className="text-sm break-all">{msg.content}</p>
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
            <form onSubmit={handleSubmit} className="p-3 border-t flex items-center bg-white">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    placeholder="Type your message..."
                />
                <button type="submit" className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}