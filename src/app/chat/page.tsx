'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Layout, { useUser } from '@/components/layout/Layout'; // Import both Layout and the hook
import UserList from '@/components/chat/UserList';
import ChatBox from '@/components/chat/ChatBox';
import { io, Socket } from 'socket.io-client';

// The socket can be defined at the top level as it doesn't depend on hooks.
const socket: Socket = io();

// Define the interface for the user you select from the list.
interface SelectedUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

// --- NEW INNER COMPONENT ---
// All the logic that needs user data now lives inside this component.
// Because it's rendered inside <Layout>, it can safely call useUser().
function ChatContent() {
  const router = useRouter();
  // This hook call is now safe because ChatContent is a child of UserProvider.
  const { profile, loading, isAuthenticated } = useUser();
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  // Effect to redirect if the user is not logged in.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Effect to connect to the socket once the user's profile is available.
  useEffect(() => {
    if (profile?.id) {
      socket.emit('user-connected', profile.id);
    }
  }, [profile?.id]);

  return (
    <div className="flex h-[calc(100vh-theme(height.16))]">
      {/* User List Panel */}
      <div className="w-1/3 md:w-1/4 h-full">
        <UserList
          onSelectUser={(user) => setSelectedUser(user)}
          currentUserId={profile?.id || null}
          selectedUserId={selectedUser?.id || null}
        />
      </div>

      {/* Chat Box Panel */}
      <div className="w-2/3 md:w-3/4 h-full">
        <ChatBox
          socket={socket}
          currentUser={profile} // Pass the profile from the context
          selectedUser={selectedUser}
        />
      </div>
    </div>
  );
}

// --- MAIN PAGE EXPORT ---
// This component's only job is to render the Layout and place the
// actual page content (ChatContent) inside it.
export default function ChatPage() {
  return (
    <Layout>
      <ChatContent />
    </Layout>
  );
}