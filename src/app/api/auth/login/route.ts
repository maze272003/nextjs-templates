// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Assuming '@/lib/db' correctly imports your database pool
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Fetch user including the 'is_verified' status
    const [rows]: any[] = await pool.execute(
      'SELECT id, email, password, is_verified FROM users WHERE email = ?',
      [email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // --- 2FA Verification Check ---
    // If the user's account is NOT verified, prevent login and redirect to OTP verification.
    if (!user.is_verified) {
      // Do NOT set isAuthenticated or user_id cookies here.
      // Inform the client that the account needs verification and provide redirect info.
      return NextResponse.json(
        { 
          message: 'Account not verified. Please verify your email.',
          redirectTo: `/verify-otp?userId=${user.id}` // Provide the userId for the client to use
        },
        { status: 403 } // 403 Forbidden - indicates the client does not have access for a valid reason (e.g., unverified)
      );
    }

    // If we reach this point, the user exists, password matches, AND the account is verified.
    // Proceed with setting authentication cookies.
    const response = NextResponse.json(
      { message: 'Login successful', user: { id: user.id, email: user.email } },
      { status: 200 }
    );

    // Set the 'isAuthenticated' cookie
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: false, // For demo, but true is recommended for security in production
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour (adjust as needed)
      path: '/',
    });

    // Set the 'user_id' cookie
    // IMPORTANT: For production, consider making user_id cookie httpOnly as well,
    // or use a more robust session management system if directly accessing userId client-side is not strictly necessary.
    response.cookies.set('user_id', user.id.toString(), {
      httpOnly: false, // For demo, but true is HIGHLY recommended for security in production
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour (adjust as needed)
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}