// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/sendEmail'; // Import the email utility
import crypto from 'crypto'; // For generating OTP

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpCreatedAt = new Date();
    const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES || '10', 10);

    // Insert user with unverified status and OTP details
    const [result]: any = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password, otp_secret, otp_created_at, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, otp, otpCreatedAt, false]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
    }

    // Send OTP email
    const emailSubject = 'Your OTP for Account Verification';
    const emailText = `Your One-Time Password (OTP) is: ${otp}. It is valid for ${otpExpirationMinutes} minutes.`;
    const emailHtml = `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong>.</p>
                       <p>This OTP is valid for ${otpExpirationMinutes} minutes. Do not share it with anyone.</p>`;

    const emailSent = await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    if (!emailSent.success) {
      // Log the error but still proceed, user can request new OTP later
      console.error('Failed to send OTP email during signup.');
      // Optionally, you might want to delete the user or mark them for review if email sending is critical.
    }

    // Do NOT set isAuthenticated cookie here. User must verify OTP first.
    // Redirect the client to the OTP verification page.
    return NextResponse.json(
      { message: 'User registered successfully. Please check your email for OTP to verify your account.', userId: result.insertId },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'This email address is already in use.' }, { status: 409 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}