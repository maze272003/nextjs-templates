'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// --- Interfaces and Context Definition ---
interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

interface UserContextType {
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Custom Hook ---
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within the Layout component');
  }
  return context;
}

// --- Provider Component ---
function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const getProfileForCurrentUser = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) throw new Error('Not authenticated');
        const sessionData = await sessionResponse.json();
        if (!sessionData.userId) throw new Error('User ID not found');

        const profileResponse = await fetch(`/api/profile?userId=${sessionData.userId}`);
        const profileData: Profile = await profileResponse.json();
        
        const fullProfile = { ...profileData, id: sessionData.userId };
        setProfile(fullProfile);
        setIsAuthenticated(true);

      } catch (error) {
        console.error('Failed to fetch profile in Layout Provider:', error);
        setProfile(null);
        setIsAuthenticated(false);
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

// --- Main Layout Component ---
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <LayoutContent>{children}</LayoutContent>
    </UserProvider>
  );
}

// --- Inner Layout Content ---
function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, loading } = useUser();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // The preloader block has been removed from here.

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        pathname={pathname}
        profile={profile}
        loadingProfile={loading}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={toggleSidebar}
          pathname={pathname}
          profile={profile}
          loadingProfile={loading}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}