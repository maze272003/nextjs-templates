// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const { pathname } = request.nextUrl;

  // --- Protect routes: dashboard, profile, chat ---
  const protectedRoutes = ['/dashboard', '/profile', '/chat'];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log('Middleware: Not authenticated, redirecting to /login.');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // --- Prevent logged-in users from seeing login/signup ---
  const authPages = ['/login', '/signup'];
  if (authPages.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      console.log('Middleware: Already authenticated, redirecting to /dashboard.');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Allow everything else through
  return NextResponse.next();
}

// 👇 Match only these routes for middleware protection
export const config = {
  matcher: ['/dashboard/:path*', '/profile', '/chat', '/login', '/signup'],
};
