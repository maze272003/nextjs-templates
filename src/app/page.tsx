// src/app/page.tsx
import { redirect } from 'next/navigation';

// This is a Server Component, so you can use `redirect`
export default function Home() {
  // Redirect users directly to the login page when they visit the root URL
  redirect('/login');
  // Note: Code after redirect() will not be executed.
}