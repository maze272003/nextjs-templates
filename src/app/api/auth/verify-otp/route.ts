import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json({ message: 'User ID and OTP are required.' }, { status: 400 });
    }

    const [rows]: any = await pool.execute(
      'SELECT otp_secret, otp_created_at, is_verified FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const user = rows[0];

    // Check if user is already verified
    if (user.is_verified) {
        return NextResponse.json({ message: 'Account is already verified.' }, { status: 400 });
    }

    const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES || '10', 10);
    const otpAgeMs = Date.now() - new Date(user.otp_created_at).getTime();
    const otpExpired = otpAgeMs > otpExpirationMinutes * 60 * 1000;

    if (user.otp_secret !== otp || otpExpired) {
      return NextResponse.json({ message: 'Invalid or expired OTP.' }, { status: 400 });
    }

    // OTP is valid: mark user as verified and clear OTP data
    await pool.execute(
      'UPDATE users SET is_verified = TRUE, otp_secret = NULL, otp_created_at = NULL WHERE id = ?',
      [userId]
    );

    // --- Create Session after successful verification ---
    const response = NextResponse.json(
      { message: 'Account verified successfully!', success: true },
      { status: 200 }
    );

    // Set 'isAuthenticated' cookie
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Set 'user_id' cookie to be accessible by client-side scripts
    response.cookies.set('user_id', userId.toString(), {
      httpOnly: false, // Set to false so it can be read by your /api/auth/check-session
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}