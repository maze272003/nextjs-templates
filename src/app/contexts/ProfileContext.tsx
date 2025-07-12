'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 1. Define the shape of the profile data
interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

// 2. Define the shape of the context value
interface UserContextType {
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// 3. Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// 4. Create the Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const getProfileForCurrentUser = async () => {
      try {
        // One request to get session and user ID
        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) {
          throw new Error('Not authenticated');
        }
        const sessionData = await sessionResponse.json();
        if (!sessionData.userId) {
          throw new Error('User ID not found');
        }

        // Second request to get profile details
        const profileResponse = await fetch(`/api/profile?userId=${sessionData.userId}`);
        if (!profileResponse.ok) {
          throw new Error('Profile not found');
        }
        const profileData = await profileResponse.json();

        // Combine data and update state
        setProfile({ ...profileData, id: sessionData.userId });
        setIsAuthenticated(true);

      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
        // Uncomment the line below if you want to force redirect on any failed auth check
        // router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getProfileForCurrentUser();
  }, [router]);

  const value = { profile, loading, isAuthenticated };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// 5. Create a custom hook for easy consumption
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}