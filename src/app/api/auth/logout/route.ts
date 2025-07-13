// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    // Clear the 'isAuthenticated' cookie
    response.cookies.set('isAuthenticated', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
    });

    // Clear the 'user_id' cookie
    response.cookies.set('user_id', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
