import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/sendEmail';
import crypto from 'crypto';
import { OkPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
    }: {
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

    const [result] = await pool.query<OkPacket>(
      `INSERT INTO users 
       (first_name, last_name, email, password, otp_secret, otp_created_at, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, otp, otpCreatedAt, false]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
    }

    const userId = result.insertId;

    const emailSubject = 'Your OTP for Account Verification';
    const emailText = `Your One-Time Password (OTP) is: ${otp}. It is valid for ${otpExpirationMinutes} minutes.`;
    const emailHtml = `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong>.</p><p>This OTP is valid for ${otpExpirationMinutes} minutes. Do not share it with anyone.</p>`;

    await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email for OTP to verify your account.',
        userId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Use proper error type narrowing
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    ) {
      const dbError = error as { code: string };
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ message: 'This email address is already in use.' }, { status: 409 });
      }
    }

    console.error('Signup error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
