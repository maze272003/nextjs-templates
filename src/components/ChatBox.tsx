// src/components/ChatBox.tsx
'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react'; // <-- Import icon

// (Your interfaces here...)
interface Profile {
    id: number;
    first_name: string;
}
interface SelectedUser {
    id: number;
    first_name: string;
    last_name: string;
}
interface Message {
    id: number | string;
    content: string;
    sender_id: number;
    username: string;
    created_at: string; // <-- Idagdag para sa timestamp
}


interface ChatBoxProps {
    socket: Socket;
    currentUser: Profile | null;
    selectedUser: SelectedUser | null;
}

export default function ChatBox({ socket, currentUser, selectedUser }: ChatBoxProps) {
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
            } finally {
                setLoadingHistory(false);
            }
        };

        if (selectedUser && currentUser) {
            setChatLog([]); // I-clear ang chat log bago mag-load ng bago
            socket.emit('join-private-room', currentUser.id, selectedUser.id);
            fetchHistory();
        }

        const handleNewMessage = (newMessage: Message) => {
            if (selectedUser && (newMessage.sender_id === selectedUser.id || newMessage.sender_id === currentUser?.id)) {
                setChatLog((prev) => [...prev, newMessage]);
            }
        };

        socket.on('new-private-message', handleNewMessage);
        
        return () => {
            socket.off('new-private-message', handleNewMessage);
        }

    }, [selectedUser, currentUser, socket]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (message.trim() && currentUser && selectedUser) {
            const messageData = {
                content: message,
                senderId: currentUser.id,
                receiverId: selectedUser.id,
                username: currentUser.first_name,
            };
            socket.emit('private-message', messageData);
            setMessage('');
        }
    };

    // Kung wala pang pinipiling ka-chat
    if (!selectedUser) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
                <MessageSquare size={64} className="mb-4" />
                <h3 className="text-xl font-semibold">Select a conversation</h3>
                <p className="text-sm">Choose someone from your contacts to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b font-semibold text-gray-800 shadow-sm">
                Chat with {selectedUser.first_name} {selectedUser.last_name}
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                {loadingHistory ? <div className="text-center text-gray-500">Loading history...</div> : (
                    chatLog.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'} mb-3`}>
                            <div className={`p-3 rounded-2xl max-w-[70%] ${
                                msg.sender_id === currentUser?.id 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-gray-200 text-black rounded-bl-none'
                            }`}>
                                {msg.sender_id !== currentUser?.id && <strong className="block text-xs text-blue-700">{msg.username}</strong>}
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 opacity-70 ${msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
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