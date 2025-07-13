'use client';

import { useState, useEffect } from "react";
import Image from 'next/image';
import UserListSkeleton from './UserListSkeleton';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
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
                const data = await response.json();

                const usersArray = data && Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
                const sortedAndFilteredUsers = usersArray
                    .filter((user: User) => user.id !== currentUserId)
                    .sort((a: User, b: User) => a.first_name.localeCompare(b.first_name));

                setUsers(sortedAndFilteredUsers);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
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
                        <li
                            key={user.id}
                            onClick={() => onSelectUser(user)}
                            className={`flex items-center space-x-4 p-3 cursor-pointer transition-colors duration-200 ${
                                isActive ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                            {user.profile_picture_url ? (
                                <Image
                                    src={user.profile_picture_url}
                                    alt={`${user.first_name} ${user.last_name}`}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {initials}
                                </div>
                            )}
                            <span className="font-medium text-gray-800 truncate">
                                {user.first_name} {user.last_name}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
