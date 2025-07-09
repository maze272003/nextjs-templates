// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';

  const { pathname } = request.nextUrl; // Destructure pathname for easier use

  // --- Logic for PROTECTED ROUTES ---
  // If the user tries to access a protected route and is NOT authenticated
  // Add '/profile' to the protected routes check
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    if (!isAuthenticated) {
      console.log('Middleware: Not authenticated, redirecting to login.');
      // Construct the redirect URL, ensuring it's always an absolute URL
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // --- Logic for AUTHENTICATION ROUTES (redirect if already logged in) ---
  // If the user tries to access login/signup while ALREADY authenticated
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (isAuthenticated) {
      console.log('Middleware: Authenticated, redirecting from auth page to dashboard.');
      // Redirect to dashboard (or a home page if you prefer)
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Allow the request to proceed if no redirect is needed
  return NextResponse.next();
}

// Update the matcher to include '/profile'
export const config = {
  matcher: ['/dashboard/:path*', '/profile', '/login', '/signup'],
};