'use client';

import { useState, useEffect } from "react";
import UserListSkeleton from './UserListSkeleton'; // <-- Import ang skeleton

interface User {
    id: number;
    first_name: string;
    last_name: string;
}

interface UserListProps {
    onSelectUser: (user: User) => void;
    currentUserId: number | null;
    selectedUserId: number | null; // <-- Idagdag para malaman kung sino ang active
}

export default function UserList({ onSelectUser, currentUserId, selectedUserId }: UserListProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true); // Simulan ang loading
            try {
                const response = await fetch('/api/users');
                const data: User[] = await response.json();
                setUsers(data.filter(user => user.id !== currentUserId));
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false); // Tapusin ang loading
            }
        };
        if(currentUserId) {
            fetchUsers();
        }
    }, [currentUserId]);

    // Gagamitin na natin ang skeleton loader! ✨
    if (loading) return <UserListSkeleton />;

    return (
        <div className="w-full h-full border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <h2 className="p-4 text-lg font-semibold border-b sticky top-0 bg-gray-50 z-10">Contacts</h2>
            <ul>
                {users.map(user => {
                    const isActive = user.id === selectedUserId;
                    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

                    return (
                        <li key={user.id} 
                            onClick={() => onSelectUser(user)}
                            className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors duration-200 ${
                                isActive ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {initials}
                            </div>
                            <span className="font-medium text-gray-800 truncate">
                                {user.first_name} {user.last_name}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    )
}