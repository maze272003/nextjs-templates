import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Type-safe custom error shape for nodemailer errors
interface NodemailerError extends Error {
  code?: string;
}

// Type guard to check if unknown error is a NodemailerError
function isNodemailerError(err: unknown): err is NodemailerError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    'name' in err &&
    typeof (err as Record<string, unknown>).message === 'string' &&
    typeof (err as Record<string, unknown>).name === 'string'
  );
}

// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Exported email sending function
export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    console.error('Error sending email:', err);

    if (isNodemailerError(err)) {
      console.error('Error message:', err.message);
      console.error('Error name:', err.name);
      if (err.code) {
        console.error('Error code:', err.code);
      }
    }

    return { success: false, error: 'Failed to send email.' };
  }
};
