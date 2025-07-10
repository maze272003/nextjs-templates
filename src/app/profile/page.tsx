'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';

// You might not need Metadata import here if you have a separate layout.tsx for profile
// import type { Metadata } from 'next';

// If you removed Metadata export from this file, keep it removed.
// If you put it back, remember the rule:
// For pages with 'use client', metadata MUST be in a separate layout.tsx or page.ts file
// in the same route segment, not directly in the component file.

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
  const [initials, setInitials] = useState('');

  // NEW STATE: For controlling the full-screen image view
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // Function to generate initials
  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  // Kunin ang profile para sa current user
  useEffect(() => {
    const getProfileForCurrentUser = async () => {
      try {
        setLoading(true);
        const sessionResponse = await fetch('/api/auth/check-session');
        if (!sessionResponse.ok) {
          throw new Error('User not authenticated. Redirecting to login.');
        }

        const sessionData = await sessionResponse.json();
        const currentUserId = sessionData.userId;

        if (!currentUserId) {
          throw new Error('Could not retrieve user ID from session.');
        }

        setUserId(currentUserId);

        const profileResponse = await fetch(`/api/profile?userId=${currentUserId}`);
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setBio(data.bio || '');
          setProfilePictureUrl(data.profile_picture_url || null);
          setInitials(getInitials(data.first_name || '', data.last_name || ''));
        } else {
          console.log(`No profile data found for user ${currentUserId}.`);
        }
      } catch (error: any) {
        console.error('Profile page fetch error:', error.message);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getProfileForCurrentUser();
  }, [router]);

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
        setInitials(getInitials(firstName, lastName));
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
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // --- NEW FUNCTIONS FOR IMAGE VIEWER ---
  const openImageViewer = () => {
    if (profilePictureUrl) { // Only open if there's an image to show
      setIsImageViewerOpen(true);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    document.body.style.overflow = ''; // Restore scrolling
  };
  // --- END NEW FUNCTIONS ---

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Edit Your Profile</h1>

          {/* Profile Picture / Initials / No Picture Placeholder */}
          <div className="flex justify-center mb-6">
            {loading ? (
              <div className="w-32 h-32 bg-slate-200 rounded-full animate-pulse"></div>
            ) : profilePictureUrl ? (
              // Make the image clickable to open the viewer
              <img
                src={profilePictureUrl}
                alt="Profile Picture"
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-md cursor-pointer transition-transform duration-200 hover:scale-105"
                onClick={openImageViewer} // Add onClick handler here
              />
            ) : initials ? (
              <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-5xl font-bold mx-auto shadow-md">
                {initials}
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm border-4 border-gray-300">
                No Picture
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} id="profile-form" className="space-y-6">
            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name:</label>
              {loading ? (
                <div className="mt-1 h-10 bg-slate-200 rounded-md animate-pulse"></div>
              ) : (
                <input
                  type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              )}
            </div>
            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name:</label>
              {loading ? (
                <div className="mt-1 h-10 bg-slate-200 rounded-md animate-pulse"></div>
              ) : (
                <input
                  type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              )}
            </div>
            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio:</label>
              {loading ? (
                <div className="mt-1 h-24 bg-slate-200 rounded-md animate-pulse"></div>
              ) : (
                <textarea
                  id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={loading}
                ></textarea>
              )}
            </div>
            {/* Profile Picture Upload Field */}
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture:</label>
              {loading ? (
                <div className="mt-1 h-10 bg-slate-200 rounded-md animate-pulse"></div>
              ) : (
                <input
                  type="file" id="profilePicture" accept="image/*" onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  disabled={loading}
                />
              )}
              {profilePicture && (
                <p className="mt-2 text-sm text-gray-500">Selected: {profilePicture.name}</p>
              )}
            </div>
          </form>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              form="profile-form"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
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
              disabled={loading}
            >
              Logout
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* NEW: Full-screen Image Viewer Modal */}
      {isImageViewerOpen && profilePictureUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={closeImageViewer} // Click anywhere on the overlay to close
        >
          <button
            onClick={closeImageViewer}
            className="absolute top-4 right-4 text-white text-4xl font-bold z-50 hover:text-gray-300 transition-colors"
            aria-label="Close image viewer"
          >
            &times; {/* HTML entity for multiplication sign, usually used for close button */}
          </button>
          <img
            src={profilePictureUrl}
            alt="Profile Picture Full View"
            className="max-w-full max-h-full object-contain cursor-zoom-out" // Add cursor for better UX
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
          />
        </div>
      )}
    </Layout>
  );
}