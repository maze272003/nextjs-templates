// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Correct path due to src/ and import alias
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const [result]: any = await pool.execute(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    // Check if the insertion was successful (optional, but good for confirmation)
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Failed to register user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      // MySQL error code for duplicate entry (e.g., duplicate email)
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}