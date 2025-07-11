'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const getProfileForCurrentUser = async () => {
      try {
        setLoadingProfile(true);

        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) {
          throw new Error('User not authenticated or session invalid.');
        }

        const sessionData = await sessionResponse.json();
        const currentUserId = sessionData.userId;

        if (!currentUserId) {
          throw new Error('Could not retrieve user ID from session.');
        }

        const profileResponse = await fetch(`/api/profile?userId=${currentUserId}`);
        if (profileResponse.ok) {
          const profileData: ProfileData = await profileResponse.json();
          setProfile(profileData);
        } else {
          console.warn(`Profile not found for userId: ${currentUserId}`);
          setProfile(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch profile in Layout:', error.message);
        setProfile(null);
        router.push('/login');
      } finally {
        setLoadingProfile(false);
      }
    };

    getProfileForCurrentUser();
  }, [router]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Ang full-page loader ay inalis na. ✅
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        pathname={pathname}
        profile={profile}
        loadingProfile={loadingProfile}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={toggleSidebar}
          pathname={pathname}
          profile={profile}
          loadingProfile={loadingProfile}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}