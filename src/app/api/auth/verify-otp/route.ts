// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { serialize } from 'cookie'; // For setting cookies

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json({ message: 'User ID and OTP are required.' }, { status: 400 });
    }

    const [rows]: any = await pool.execute(
      'SELECT otp_secret, otp_created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const user = rows[0];
    const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES || '10', 10);
    const otpAgeMs = Date.now() - new Date(user.otp_created_at).getTime();
    const otpExpired = otpAgeMs > otpExpirationMinutes * 60 * 1000;

    if (user.otp_secret !== otp || otpExpired) {
      return NextResponse.json({ message: 'Invalid or expired OTP.' }, { status: 400 });
    }

    // OTP is valid and not expired, mark user as verified and clear OTP data
    await pool.execute(
      'UPDATE users SET is_verified = TRUE, otp_secret = NULL, otp_created_at = NULL WHERE id = ?',
      [userId]
    );

    // Set authentication cookie after successful verification
    const response = NextResponse.json(
      { message: 'Account verified successfully!', success: true },
      { status: 200 }
    );

    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}