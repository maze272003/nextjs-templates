// src/lib/sendEmail.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to 'outlook', 'yahoo', or define a custom host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Optional: For local development with self-signed certs or if you encounter issues
  tls: {
    rejectUnauthorized: false
  }
});

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to, // List of recipients
      subject, // Subject line
      text, // Plain text body
      html, // HTML body
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    // Log more details about the error if needed
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      // @ts-ignore // Nodemailer specific error codes
      if (error.code) console.error('Error code:', error.code);
    }
    return { success: false, error: 'Failed to send email.' };
  }
};