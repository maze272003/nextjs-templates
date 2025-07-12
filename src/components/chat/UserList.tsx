'use client';

import { useState, useEffect } from "react";
import UserListSkeleton from './UserListSkeleton';

// FIX: Update the User interface to include the profile picture URL
interface User {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null; // Can be a string or null
}

interface UserListProps {
    onSelectUser: (user: User) => void;
    currentUserId: number | null;
    selectedUserId: number | null;
}

export default function UserList({ onSelectUser, currentUserId, selectedUserId }: UserListProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/users');
                const data: User[] = await response.json();
                setUsers(data.filter(user => user.id !== currentUserId));
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };
        if(currentUserId) {
            fetchUsers();
        }
    }, [currentUserId]);

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
                            className={`flex items-center space-x-4 p-3 cursor-pointer transition-colors duration-200 ${
                                isActive ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                            {/* --- AVATAR FIX --- */}
                            {user.profile_picture_url ? (
                                // If user has a profile picture, display it
                                <img 
                                    src={user.profile_picture_url} 
                                    alt={`${user.first_name} ${user.last_name}`}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                // Otherwise, display the initials as a fallback
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {initials}
                                </div>
                            )}
                            {/* --- END AVATAR FIX --- */}

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