// src/app/resend-otp/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';


export default function ResendOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = searchParams.get('userId');
    if (id) {
      setUserId(id);
    } else {
      setMessage('User ID is missing. Please go back to login/signup.');
      setIsError(true);
    }
  }, [searchParams]);

  const handleResend = async () => {
    setMessage('');
    setIsError(false);
    setIsSubmitting(true);

    if (!userId) {
      setMessage('Cannot resend: User ID not found.');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'New OTP sent successfully!');
        setIsError(false);
        // Optional: redirect back to verify-otp page after resending
        setTimeout(() => {
          router.push(`/verify-otp?userId=${userId}`);
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to resend OTP.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Client-side resend OTP error:', error);
      setMessage('An unexpected error occurred while trying to resend OTP.');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Resend One-Time Password</h1>
        {userId ? (
          <>
            <p className="text-gray-600 mb-4">
              Click the button below to request a new OTP to be sent to your registered email.
            </p>
            <button
              onClick={handleResend}
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Sending...' : 'Resend OTP'}
            </button>
          </>
        ) : (
          <p className="text-red-600">{message}</p>
        )}

        {message && !isError && (
          <p className={`mt-4 text-sm text-green-600`}>{message}</p>
        )}
        {message && isError && (
          <p className={`mt-4 text-sm text-red-600`}>{message}</p>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/verify-otp" className="font-medium text-indigo-600 hover:text-indigo-500">
            I have an OTP
          </Link>
        </p>
      </div>
    </div>
  );
}