// src/app/profile/page.tsx
'use client'; // Make this a Client Component for interactivity

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null); // State to hold the user ID
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null); // Current picture URL
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); // To style message based on success/error
  const [loading, setLoading] = useState(true);

  // In a real application, you'd get the user ID from your authentication context (e.g., JWT)
  // For this example, let's assume a hardcoded ID for demo purposes.
  // In a real app, you might decode a JWT from a cookie here or fetch from an auth context.
  useEffect(() => {
    // This is a placeholder. REPLACE with actual way to get current user's ID
    // E.g., if you had NextAuth.js, you'd use useSession().data.user.id
    // For now, let's assume the user is ID 1 (based on your middleware example)
    const demoUserId = '1'; // Replace with dynamic user ID in production
    setUserId(demoUserId);
  }, []);

  // Fetch profile data when userId is available
  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(`/api/profile?userId=${userId}`);
          const data = await response.json();

          if (response.ok) {
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setBio(data.bio || '');
            setProfilePictureUrl(data.profile_picture_url || null);
          } else {
            setMessage(data.message || 'Failed to load profile.');
            setIsError(true);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setMessage('An error occurred while loading profile.');
          setIsError(true);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false); // If no user ID, stop loading
    }
  }, [userId]);

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
        body: formData, // No 'Content-Type' header needed for FormData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Profile updated successfully!');
        setIsError(false);
        // Update the displayed profile picture immediately if a new one was uploaded
        if (data.profile_picture_url) {
          setProfilePictureUrl(data.profile_picture_url);
          setProfilePicture(null); // Clear the selected file input
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Edit Your Profile</h1>

        {/* Current Profile Picture Display */}
        {profilePictureUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={profilePictureUrl}
              alt="Profile Picture"
              className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-md"
            />
          </div>
        )}
        {!profilePictureUrl && (
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm border-4 border-gray-300">
              No Picture
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name:</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name:</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio:</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture:</label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files ? e.target.files[0] : null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {profilePicture && (
              <p className="mt-2 text-sm text-gray-500">Selected: {profilePicture.name}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Profile
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center ${isError ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}