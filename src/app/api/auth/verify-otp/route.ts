// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Clean interface for PostgreSQL user data
interface UserRow {
  otp_secret: string;
  otp_created_at: Date;
  is_verified: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json({ message: 'User ID and OTP are required.' }, { status: 400 });
    }

    // Use pool.query with $1 placeholder and { rows } destructuring
    const { rows } = await pool.query<UserRow>(
      'SELECT otp_secret, otp_created_at, is_verified FROM users WHERE id = $1',
      [userId]
    );

    const user = rows[0];
    if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    if (user.is_verified) return NextResponse.json({ message: 'Account is already verified.' }, { status: 400 });

    const otpAgeMs = Date.now() - new Date(user.otp_created_at).getTime();
    const expired = otpAgeMs > (parseInt(process.env.OTP_EXPIRATION_MINUTES || '10') * 60 * 1000);

    if (user.otp_secret !== otp || expired) {
      return NextResponse.json({ message: 'Invalid or expired OTP.' }, { status: 400 });
    }

    // Use pool.query for the UPDATE statement as well
    await pool.query('UPDATE users SET is_verified = TRUE, otp_secret = NULL, otp_created_at = NULL WHERE id = $1', [userId]);

    const response = NextResponse.json({ message: 'Account verified successfully!', success: true }, { status: 200 });

    // This cookie logic remains the same
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user_id', userId.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}