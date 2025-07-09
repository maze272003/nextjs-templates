// src/app/dashboard/page.tsx
'use client'; // Make this a Client Component for interactivity

import { useRouter } from 'next/navigation'; // Import useRouter for client-side navigation
import { useState } from 'react'; // For message state, if desired

export default function DashboardPage() {
  const router = useRouter();
  const [message, setMessage] = useState(''); // Optional: for displaying logout messages

  const handleLogout = async () => {
    setMessage('Logging out...'); // Optional: display immediate message

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
        // Redirect to login page after successful logout
        setTimeout(() => {
          router.push('/login');
        }, 500); // Short delay before redirect
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
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard!</h1>
        <p className="text-lg text-gray-700 mb-6">This is a protected route. You've successfully logged in.</p>

        {/* Optional message display */}
        {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
}