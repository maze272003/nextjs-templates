// api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Siguraduhin na 'pool' ang gamit mo, hindi 'db'
import { RowDataPacket } from 'mysql2';
import { uploadFileToS3 } from '@/lib/s3-upload'; // <-- I-IMPORT ANG S3 HELPER

// HINDI NA KAILANGAN ANG 'path', 'fs', o 'existsSync'

// Extend mysql2's RowDataPacket for proper type support
interface UserProfile extends RowDataPacket {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
}

interface ProfilePictureResult extends RowDataPacket {
  profile_picture_url: string;
}

// GET /api/profile?userId=123
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID missing for profile fetch.' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<UserProfile[]>(
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

// PUT /api/profile?userId=123 (with form-data)
export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID missing for profile update.' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    let profile_picture_url: string | null = null;
    const updateValues: (string | null)[] = [];
    const updateFields: string[] = [];

    // --- BAGO: Handle profile picture upload with S3 ---
    const profilePictureFile = formData.get('profilePicture') as File | null;

    if (profilePictureFile && profilePictureFile.size > 0) {
      // 1. I-upload ang bagong file sa S3
      console.log('Uploading profile picture to S3...');
      profile_picture_url = await uploadFileToS3(profilePictureFile, 'profile_pictures');
      console.log('Upload complete. URL:', profile_picture_url);
      
      // 2. (Optional) Pwede mo ring i-delete 'yung lumang file sa S3,
      //    pero mas kumplikado 'yon. Sa ngayon, hayaan muna natin.
    }
    // --- TAPOS NA ANG FILE UPLOAD LOGIC ---

    // Collect text fields
    const formFields = {
      first_name: formData.get('first_name') as string | null,
      last_name: formData.get('last_name') as string | null,
      bio: formData.get('bio') as string | null,
    };

    for (const [key, value] of Object.entries(formFields)) {
      if (value !== null && value !== undefined) {
        updateValues.push(value);
        updateFields.push(`${key} = ?`);
      }
    }

    if (profile_picture_url) {
      updateValues.push(profile_picture_url);
      updateFields.push('profile_picture_url = ?');
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'No data provided for update.' }, { status: 400 });
    }

    updateValues.push(userId); // for WHERE clause
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.query(query, updateValues);

    return NextResponse.json(
      { message: 'Profile updated successfully', profile_picture_url },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}