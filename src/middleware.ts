// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // --- IMPORTANT: This is a simplified example for demonstration ---
  // This 'isAuthenticated' cookie is set by your login API route for demo purposes.
  // In a real app, you'd read and verify a JWT from an HTTP-only cookie.
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';

  // If the user tries to access the dashboard and is NOT authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log('Middleware: Not authenticated, redirecting to login.');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If the user tries to access login/signup while ALREADY authenticated
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')) {
    if (isAuthenticated) {
      console.log('Middleware: Authenticated, redirecting from auth page to dashboard.');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Allow the request to proceed if no redirect is needed
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};