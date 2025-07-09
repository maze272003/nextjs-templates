// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    // <--- 1. Get firstName and lastName from the request
    const { firstName, lastName, email, password } = await req.json();

    // <--- 2. Add validation for the new fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // <--- 3. Update the SQL query to include first_name and last_name
    const [result]: any = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
    }

    // <--- 4. CRITICAL: Set cookie to auto-login and then send the response
    const response = NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );

    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'This email address is already in use.' }, { status: 409 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}