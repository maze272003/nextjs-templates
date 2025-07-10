'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// Define the ProfileData interface
interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Function to fetch user profile data
    const getProfileForCurrentUser = async () => {
      try {
        setLoadingProfile(true); // Ensure loading state is true at the start of fetch
        
        // Step 1: Check for user session to get current user ID
        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) {
          // If session is not OK, assume no authenticated user or an error occurred
          throw new Error('User not authenticated or session invalid.');
        }

        const sessionData = await sessionResponse.json();
        const currentUserId = sessionData.userId;

        if (!currentUserId) {
          // No user ID means no active user to fetch profile for
          throw new Error('Could not retrieve user ID from session.');
        }

        // Step 2: Fetch profile using the retrieved user ID
        const profileResponse = await fetch(`/api/profile?userId=${currentUserId}`);
        if (profileResponse.ok) {
          const profileData: ProfileData = await profileResponse.json();
          setProfile(profileData);
        } else {
          // Profile not found or another error with profile API
          setProfile(null);
          console.warn(`Profile not found for userId: ${currentUserId}`);
        }
      } catch (error: any) {
        console.error('Failed to fetch profile in Layout:', error.message);
        setProfile(null); // Clear profile on error
        // Consider handling authentication errors more explicitly, e.g., redirect to login
      } finally {
        setLoadingProfile(false); // Always set loading to false after attempt
      }
    };

    // Execute the profile fetching function once when the component mounts
    getProfileForCurrentUser();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

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

        {/* Main content area, scrolls independently */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}