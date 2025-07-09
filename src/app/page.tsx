// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
      <h1 className="text-5xl font-extrabold mb-6 text-center leading-tight">
        Welcome to My Auth App
      </h1>
      <p className="text-xl text-center mb-8 max-w-lg">
        Securely manage your account. Please login or sign up to continue.
      </p>
      <div className="flex space-x-4">
        {/* UPDATED HERE */}
        <Link
          href="/login"
          className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105"
        >
          Login
        </Link>
        {/* UPDATED HERE */}
        <Link
          href="/signup"
          className="bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-800 transition duration-300 ease-in-out transform hover:scale-105"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}