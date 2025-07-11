// src/contexts/ProfileContext.tsx
'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Interface for the profile data
export interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

// Interface for the context value
interface ProfileContextType {
  profile: ProfileData | null;
  loadingProfile: boolean;
  refetchProfile: () => void; // Function to manually refetch profile data after an update
}

// Create the context with a default undefined value
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Provider component that will wrap our authenticated routes
export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      // 1. Check if the user is authenticated
      const sessionResponse = await fetch('/api/auth/check-session');
      if (!sessionResponse.ok) {
        throw new Error('User not authenticated. Redirecting to login.');
      }
      const sessionData = await sessionResponse.json();
      const currentUserId = sessionData.userId;

      if (!currentUserId) {
        throw new Error('Could not retrieve user ID from session.');
      }

      // 2. Fetch the user's profile data
      const profileResponse = await fetch(`/api/profile?userId=${currentUserId}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile({ ...profileData, id: currentUserId }); // Add user ID to profile object
      } else {
        // If no profile exists, create a basic profile object
        setProfile({ id: currentUserId, first_name: 'New', last_name: 'User', bio: '', profile_picture_url: null });
      }
    } catch (error: any) {
      console.error('ProfileProvider fetch error:', error.message);
      setProfile(null);
      router.push('/login'); // Redirect to login on any auth error
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  return (
    <ProfileContext.Provider value={{ profile, loadingProfile, refetchProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};