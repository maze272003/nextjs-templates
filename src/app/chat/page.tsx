// src/app/chat/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout'; // Assuming this is your main layout
import UserList from '@/components/chat/UserList';
import ChatBox from '@/components/chat/ChatBox';
import { io, Socket } from 'socket.io-client';

// I-declare ang socket sa labas para mag-persist
const socket: Socket = io();

// Mag-define ng types
interface Profile {
    id: number;
    first_name: string;
    last_name: string;
    bio: string;
    profile_picture_url: string | null;
}

interface SelectedUser {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
}

export default function ChatPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

    useEffect(() => {
        const getProfileForCurrentUser = async () => {
            try {
                const sessionResponse = await fetch('/api/auth/check-session');
                if (!sessionResponse.ok) throw new Error('Not authenticated');
                const sessionData = await sessionResponse.json();
                if (!sessionData.userId) throw new Error('User ID not found');

                const profileResponse = await fetch(`/api/profile?userId=${sessionData.userId}`);
                const profileData: Profile = await profileResponse.json();
                
                // Siguraduhing may ID ang profile object
                const fullProfile = { ...profileData, id: sessionData.userId };
                setProfile(fullProfile); 

                // Ipadala ang user ID sa socket server para malaman na online ka
                socket.emit('user-connected', sessionData.userId);

            } catch (error) {
                router.push('/login');
            }
        };

        getProfileForCurrentUser();
    }, [router]);

    return (
        <Layout>
            <div className="flex h-[calc(100vh-theme(height.16))]"> {/* Adjust height based on your navbar height (h-16 is a common value) */}
                {/* User List Panel (Left) */}
                <div className="w-1/3 md:w-1/4 h-full">
                    <UserList 
                        onSelectUser={(user) => setSelectedUser(user)} 
                        currentUserId={profile?.id || null} 
                        selectedUserId={selectedUser?.id || null}
                    />
                </div>

                {/* Chat Box Panel (Right) */}
                <div className="w-2/3 md:w-3/4 h-full">
                    <ChatBox 
                        socket={socket} 
                        currentUser={profile} 
                        selectedUser={selectedUser} 
                    />
                </div>
            </div>
        </Layout>
    );
}