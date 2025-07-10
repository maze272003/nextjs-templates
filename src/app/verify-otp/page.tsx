// src/app/verify-otp/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get userId from URL query parameter (passed after signup)
    const id = searchParams.get('userId');
    if (id) {
      setUserId(id);
    } else {
      // If no userId, maybe redirect them to signup or show an error
      setMessage('User ID is missing. Please sign up again.');
      setIsError(true);
      // Optional: router.push('/signup');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsSubmitting(true);

    if (!userId) {
      setMessage('User ID not found. Cannot verify.');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }
    if (!otp) {
      setMessage('Please enter the OTP.');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Verification successful! Redirecting to dashboard...');
        setIsError(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setMessage(data.message || 'OTP verification failed.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Client-side OTP verification error:', error);
      setMessage('An unexpected error occurred during OTP verification.');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Verify Your Account</h1>
        <p className="text-center text-gray-600 mb-4">
          A One-Time Password (OTP) has been sent to your email address. Please enter it below to verify your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">One-Time Password:</label>
            <input
              type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg tracking-wider"
              placeholder="••••••"
              maxLength={6}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit" disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        {/* Optional: Resend OTP link */}
        <p className="mt-4 text-center text-sm text-gray-600">
          Didn't receive the OTP?{' '}
          {/* You'll need to create a new API route for resending OTP */}
          <Link href={`/resend-otp?userId=${userId}`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Resend OTP
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}