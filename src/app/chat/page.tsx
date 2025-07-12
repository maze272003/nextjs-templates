'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout, { useUser } from '@/components/layout/Layout';
import UserList from '@/components/chat/UserList';
import ChatBox from '@/components/chat/ChatBox';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io();

interface SelectedUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

// Inner component for chat logic
function ChatContent() {
  const router = useRouter();
  const { profile, loading, isAuthenticated } = useUser();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  // Existing useEffects for auth and socket connection remain the same...
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (profile?.id) {
      socket.emit('user-connected', profile.id);
    }
  }, [profile?.id]);

  // This boolean determines if we're in a chat view on mobile
  const isChatActive = selectedUser !== null;

  return (
    // The main container is now a flex container for responsiveness
    <div className="flex h-[calc(100vh-theme(height.16))]">

      {/* --- User List Panel --- */}
      {/* On mobile, this is hidden when a chat is active. */}
      {/* On md screens and up, it's always visible. */}
      <div className={`
        ${isChatActive ? 'hidden' : 'block'} 
        w-full 
        md:block md:w-1/3 lg:w-1/4
      `}>
        <UserList
          onSelectUser={(user) => setSelectedUser(user)}
          currentUserId={profile?.id || null}
          selectedUserId={selectedUser?.id || null}
        />
      </div>

      {/* --- Chat Box Panel --- */}
      {/* On mobile, this is shown ONLY when a chat is active. */}
      {/* On md screens and up, it's always visible. */}
      <div className={`
        ${isChatActive ? 'block' : 'hidden'}
        w-full
        md:block md:w-2/3 lg:w-3/4
      `}>
        <ChatBox
          socket={socket}
          currentUser={profile}
          selectedUser={selectedUser}
          onBack={() => setSelectedUser(null)} // Pass the function to clear selection
        />
      </div>
    </div>
  );
}

// Main page export
export default function ChatPage() {
  return (
    <Layout>
      <ChatContent />
    </Layout>
  );
}