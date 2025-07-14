import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { RowDataPacket } from 'mysql2';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/profile_pictures');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

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
  await ensureUploadDir();

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

    // Handle profile picture upload
    const profilePictureFile = formData.get('profilePicture') as File | null;
    if (profilePictureFile && profilePictureFile.size > 0) {
      const [oldProfileResult] = await pool.query<ProfilePictureResult[]>(
        'SELECT profile_picture_url FROM users WHERE id = ?',
        [userId]
      );

      const oldProfileUrl = oldProfileResult[0]?.profile_picture_url;

      const newFileName = `${userId}_${Date.now()}${path.extname(profilePictureFile.name)}`;
      const filePath = path.join(UPLOAD_DIR, newFileName);
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      profile_picture_url = `/uploads/profile_pictures/${newFileName}`;

      if (oldProfileUrl && oldProfileUrl.startsWith('/uploads')) {
        const oldPicturePath = path.join(process.cwd(), 'public', oldProfileUrl);
        try {
          await fs.unlink(oldPicturePath);
        } catch (unlinkError: unknown) {
          if (
            unlinkError &&
            typeof unlinkError === 'object' &&
            'code' in unlinkError &&
            (unlinkError as { code: string }).code !== 'ENOENT'
          ) {
            console.warn('Could not delete old profile picture:', unlinkError);
          }
        }
      }
    }

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
