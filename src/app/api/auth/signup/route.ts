// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/sendEmail';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpCreatedAt = new Date();
    const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES || '10', 10);

    // Use pool.query with PostgreSQL placeholders ($1, $2, etc.)
    // Added 'RETURNING id' to get the new user's ID back
    const result = await pool.query(
      `INSERT INTO users 
       (first_name, last_name, email, password, otp_secret, otp_created_at, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [firstName, lastName, email, hashedPassword, otp, otpCreatedAt, false]
    );

    // Check rowCount instead of affectedRows
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
    }

    const emailSubject = 'Your OTP for Account Verification';
    const emailText = `Your One-Time Password (OTP) is: ${otp}. It is valid for ${otpExpirationMinutes} minutes.`;
    const emailHtml = `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong>.</p><p>This OTP is valid for ${otpExpirationMinutes} minutes. Do not share it with anyone.</p>`;

    await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    // Get the new userId from the 'rows' property
    const userId = result.rows[0].id;

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email for OTP to verify your account.',
        userId: userId
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    // Check for PostgreSQL's unique violation error code '23505'
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return NextResponse.json({ message: 'This email address is already in use.' }, { status: 409 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}