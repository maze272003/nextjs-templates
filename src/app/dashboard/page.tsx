// src/app/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link for navigation

// Define a type for the profile data for better type safety
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

  // In a real app, the userId would come from an authentication context
  // We'll use a placeholder like in your profile page for this example.
  const userId = '1'; // Replace with dynamic user ID in production

  // Fetch profile data when the component mounts
  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(`/api/profile?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
          } else {
            console.error('Failed to fetch profile data.');
          }
        } catch (error) {
          console.error('An error occurred while fetching profile:', error);
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [userId]); // Dependency array ensures this runs once when userId is set

  const handleLogout = async () => {
    setMessage('Logging out...');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'You have been logged out.');
        setTimeout(() => {
          router.push('/login');
        }, 500);
      } else {
        setMessage(data.message || 'Logout failed.');
      }
    } catch (error) {
      console.error('Client-side logout error:', error);
      setMessage('An unexpected error occurred during logout.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        
        {/* --- PROFILE INFORMATION DISPLAY --- */}
        {loadingProfile ? (
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          </div>
        ) : profile ? (
          <div className="mb-8">
            <img
              src={profile.profile_picture_url || '/default-avatar.png'} // Provide a fallback image
              alt="Profile Picture"
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-gray-200"
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {profile.first_name || 'User'}!
            </h1>
            <p className="text-md text-gray-600 mt-2">
              {profile.bio || 'No bio provided.'}
            </p>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard!</h1>
        )}

        <p className="text-lg text-gray-700 mb-6">This is a protected route. You've successfully logged in.</p>

        {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
          <Link
            href="/profile"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            View/Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}