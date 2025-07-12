'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Layout, { useUser } from '@/components/layout/Layout';

// --- NEW INNER COMPONENT ---
// All the logic and JSX for the dashboard now lives inside this component.
// It can safely call useUser() because it will be rendered inside the Layout.
function DashboardContent() {
  const router = useRouter();
  // This hook call is now safe.
  const { profile, loading, isAuthenticated } = useUser();

  // This effect handles redirection if the user is not logged in.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : '';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl space-y-6">
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="w-28 h-28 bg-slate-200 rounded-full mx-auto"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile Picture"
                  className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white shadow-md"
                />
              ) : initials ? (
                <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-md">
                  {initials}
                </div>
              ) : (
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
  );
}


// --- MAIN PAGE EXPORT ---
// The default export is now a simple wrapper that renders the Layout
// with the actual page content inside it.
export default function DashboardPage() {
  return (
    <Layout>
      <DashboardContent />
    </Layout>
  );
}