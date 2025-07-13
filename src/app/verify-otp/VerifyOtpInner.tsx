'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyOtpInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
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

  const handleVerify = async () => {
    setMessage('');
    setIsError(false);
    setIsSubmitting(true);

    if (!userId || !otp) {
      setMessage('Please enter your OTP.');
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
        setMessage(data.message || 'OTP verified successfully!');
        setIsError(false);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage(data.message || 'Invalid OTP. Please try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Client-side OTP verify error:', error);
      setMessage('An error occurred while verifying OTP.');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Verify OTP</h1>

        {userId ? (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mb-4 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleVerify}
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </>
        ) : (
          <p className="text-red-600">{message}</p>
        )}

        {message && !isError && (
          <p className="mt-4 text-sm text-green-600">{message}</p>
        )}
        {message && isError && (
          <p className="mt-4 text-sm text-red-600">{message}</p>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          Didn't receive an OTP?{' '}
          <Link
            href={`/resend-otp?userId=${userId ?? ''}`}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Resend OTP
          </Link>
        </p>
      </div>
    </div>
  );
}
