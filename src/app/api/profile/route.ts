// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import path from 'path';
import fs from 'fs/promises'; // Use fs/promises for async file operations
import { existsSync } from 'fs'; // To check if directory exists
import { IncomingForm } from 'formidable'; // For parsing multipart/form-data
// No need for pipeline from stream/promises with formidable's default parsing

// Define the absolute path to the public uploads directory
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/profile_pictures');

// Ensure the upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// IMPORTANT: Disable Next.js Body Parser for file uploads with formidable
export const config = {
  api: {
    bodyParser: false, // Disables the default body parser to handle file uploads manually
  },
};

// Helper function to parse FormData (for file uploads)
async function parseFormData(req: NextRequest) {
  // Use a ReadableStream from NextRequest body
  const data = await req.formData();
  // Formidable expects a Node.js IncomingMessage, so direct use with NextRequest.formData()
  // might be more straightforward if you only need the data and not streaming
  // For standard file uploads with NextRequest, you can access files directly from data.get('fieldName')

  // Reverting to formidable approach as it's robust for file uploads
  // Note: formidable's .parse() expects a Node.js IncomingMessage.
  // NextRequest body can be converted to stream, but it's simpler to let formidable handle it
  // as it's designed for this. Next.js does have direct formData() on NextRequest.
  // Let's adapt the formidable usage for Next.js App Router's NextRequest.
  // The simplest way to integrate formidable with Next.js App Router for file uploads
  // requires a slightly different approach than the direct .parse(req) because NextRequest
  // is not an IncomingMessage directly.
  // We'll use the .formData() method available directly on NextRequest now.
  // This simplifies things significantly and removes the need for formidable for basic uploads.

  // Let's ditch formidable for simplicity with NextRequest.formData()
  // If you *really* need formidable's advanced features, the integration is more complex.
  // For basic file and field parsing, NextRequest.formData() is superior here.

  return { fields: data, files: data }; // Adapting for easier access
}

// GET /api/profile - Fetch user profile
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId'); // Get userId from query params

  if (!userId) {
     return NextResponse.json({ message: "User ID missing for profile fetch." }, { status: 400 });
  }

  try {
    const [rows]: any = await pool.execute(
      'SELECT id, email, first_name, last_name, bio, profile_picture_url FROM users WHERE id = ?',
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// PUT /api/profile - Update user profile and handle picture upload
export async function PUT(req: NextRequest) {
  await ensureUploadDir(); // Make sure the directory exists

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId'); // Get userId from query params

  if (!userId) {
     return NextResponse.json({ message: "User ID missing for profile update." }, { status: 400 });
  }

  try {
    // Using NextRequest.formData() directly, which is built-in for App Router
    const formData = await req.formData();

    const first_name = formData.get('first_name') as string | null;
    const last_name = formData.get('last_name') as string | null;
    const bio = formData.get('bio') as string | null;
    const profilePictureFile = formData.get('profilePicture') as File | null;

    let profile_picture_url: string | null = null;

    if (profilePictureFile && profilePictureFile.size > 0) {
      const originalFileName = profilePictureFile.name;
      const fileExtension = path.extname(originalFileName);
      const newFileName = `${userId}_${Date.now()}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, newFileName);

      // Write the file to disk
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      profile_picture_url = `/uploads/profile_pictures/${newFileName}`;

      // Optional: Delete old profile picture if it exists
      const [oldProfileRows]: any = await pool.execute(
        'SELECT profile_picture_url FROM users WHERE id = ?',
        [userId]
      );
      const oldProfileUrl = oldProfileRows[0]?.profile_picture_url;
      if (oldProfileUrl && oldProfileUrl.startsWith('/uploads')) {
        const oldPicturePath = path.join(process.cwd(), 'public', oldProfileUrl);
        try {
          await fs.unlink(oldPicturePath);
        } catch (unlinkError: any) {
          if (unlinkError.code !== 'ENOENT') {
            console.warn('Could not delete old profile picture:', unlinkError);
          }
        }
      }
    }

    // Prepare update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (first_name !== null) { updateFields.push('first_name = ?'); updateValues.push(first_name); }
    if (last_name !== null) { updateFields.push('last_name = ?'); updateValues.push(last_name); }
    if (bio !== null) { updateFields.push('bio = ?'); updateValues.push(bio); }
    if (profile_picture_url !== null) { updateFields.push('profile_picture_url = ?'); updateValues.push(profile_picture_url); }


    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'No data provided for update.' }, { status: 400 });
    }

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.execute(query, [...updateValues, userId]);

    return NextResponse.json({ message: 'Profile updated successfully', profile_picture_url }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}