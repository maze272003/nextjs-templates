'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  // **BAGONG LOGIC: Kunin ang profile para sa current user**
  useEffect(() => {
    const getProfileForCurrentUser = async () => {
      try {
        // Step 1: I-check kung sino ang naka-login
        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) {
          throw new Error('User not authenticated. Redirecting to login.');
        }

        const sessionData = await sessionResponse.json();
        const currentUserId = sessionData.userId;

        if (!currentUserId) {
          throw new Error('Could not retrieve user ID from session.');
        }
        
        // I-set ang user ID sa state para magamit sa pag-update mamaya
        setUserId(currentUserId);

        // Step 2: I-fetch ang profile gamit ang nakuha nating ID
        const profileResponse = await fetch(`/api/profile?userId=${currentUserId}`);
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setBio(data.bio || '');
          setProfilePictureUrl(data.profile_picture_url || null);
        } else {
          // Normal lang na 404 kung wala pang profile ang user
          console.log(`No profile data found for user ${currentUserId}.`);
        }
      } catch (error: any) {
        console.error('Profile page fetch error:', error.message);
        router.push('/login'); // Kung may problema, pabalikin sa login
      } finally {
        setLoading(false);
      }
    };

    getProfileForCurrentUser();
  }, [router]); // Ang dependency array ay [router] para tumakbo ito isang beses

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    if (!userId) {
      setMessage('User not identified. Cannot update profile.');
      setIsError(true);
      return;
    }

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('bio', bio);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    try {
      // Gagamitin ng 'PUT' request ang userId na nasa state
      const response = await fetch(`/api/profile?userId=${userId}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Profile updated successfully!');
        setIsError(false);
        if (data.profile_picture_url) {
          setProfilePictureUrl(data.profile_picture_url);
          setProfilePicture(null);
        }
      } else {
        setMessage(data.message || 'Failed to update profile.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Client-side profile update error:', error);
      setMessage('An unexpected error occurred during profile update.');
      setIsError(true);
    }
  };
  
  const handleLogout = async () => {
    // ... (logout logic is the same)
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Ang JSX part ay pareho pa rin, hindi na kailangan baguhin
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Edit Your Profile</h1>

        {profilePictureUrl ? (
          <div className="flex justify-center mb-6">
            <img
              src={profilePictureUrl}
              alt="Profile Picture"
              className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-md"
            />
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm border-4 border-gray-300">
              No Picture
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} id="profile-form" className="space-y-6">
          {/* ... form inputs ... */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name:</label>
            <input
              type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name:</label>
            <input
              type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio:</label>
            <textarea
              id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture:</label>
            <input
              type="file" id="profilePicture" accept="image/*" onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {profilePicture && (
              <p className="mt-2 text-sm text-gray-500">Selected: {profilePicture.name}</p>
            )}
          </div>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              form="profile-form"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Profile
            </button>
            <Link
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
        </div>

        {message && (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}