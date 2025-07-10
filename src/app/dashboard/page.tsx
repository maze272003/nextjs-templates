'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';

interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  profile_picture_url: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [initials, setInitials] = useState('');

  useEffect(() => {
    const getProfileForCurrentUser = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) {
          throw new Error('User not authenticated. Redirecting to login.');
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
          
          // Gumawa ng initials mula sa pangalan
          const userInitials = `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`.toUpperCase();
          setInitials(userInitials);

        } else {
          setProfile(null);
        }
      } catch (error: any) {
        console.error('Dashboard fetch error:', error.message);
        router.push('/login');
      } finally {
        setLoadingProfile(false);
      }
    };

    getProfileForCurrentUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Layout>
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl space-y-6">
        
        {loadingProfile ? (
          <div className="animate-pulse space-y-4">
            <div className="w-28 h-28 bg-slate-200 rounded-full mx-auto"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* --- AVATAR LOGIC: Picture, Initials, or Generic Icon --- */}
            <div className="mb-4">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile Picture"
                  className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white shadow-md"
                />
              ) : initials ? (
                // Kung walang picture pero may pangalan, ipakita ang initials
                <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-md">
                  {initials}
                </div>
              ) : (
                 // Kung bagong user at wala pang pangalan
                <div className="w-28 h-28 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-5xl mx-auto shadow-md">
                  👋
                </div>
              )}
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-800">
                  Welcome, {profile?.first_name || 'User'}!
                </h1>
                <p className="text-md text-slate-500 max-w-md mx-auto">
                  {profile?.bio || "It looks like you're new here! Set up your profile to get started."}
                </p>
            </div>
          </div>
        )}

        {message && <p className="text-sm text-red-600">{message}</p>}

        {/* --- MGA BUTTON --- */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <Link
            href="/profile"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            View/Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-6 rounded-lg border border-slate-200 transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
     </Layout>
  );
}