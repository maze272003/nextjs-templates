// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    // Clear the 'isAuthenticated' cookie by setting its expiration to a past date
    response.cookies.set('isAuthenticated', '', {
      httpOnly: false, // Match the setting in login route for demonstration
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set expiry to past date to delete it immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}