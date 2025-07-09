// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const [rows]: any[] = await pool.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
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

    // --- DITO ANG PAGBABAGO ---
    // Create a response object
    const response = NextResponse.json(
      { message: 'Login successful', user: { id: user.id, email: user.email } },
      { status: 200 }
    );

    // Set a simple, non-secure cookie for demonstration.
    // In production, this would be an HTTP-only, secure, signed JWT cookie.
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: false, // For demo, allow JS to read. In prod, set to true.
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      maxAge: 60 * 60, // 1 hour for demo
      path: '/',
    });

    return response;
    // --- END NG PAGBABAGO ---
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}