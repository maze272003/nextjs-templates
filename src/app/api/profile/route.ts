import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { RowDataPacket } from 'mysql2';

// 1. I-configure ang Base Directory: "/app" ang root ng iyong application sa Coolify container.
// Ang 'public' folder ay nasa loob ng /app.
const BASE_APP_DIR = process.cwd(); // Ito ay dapat /app sa Coolify
const PUBLIC_UPLOADS_FOLDER = 'public/uploads/profile_pictures'; 
// Ang SERVER_SAVE_DIR ay ang full path sa loob ng Volume Mount (e.g., /app/public/uploads/profile_pictures)
const SERVER_SAVE_DIR = path.join(BASE_APP_DIR, PUBLIC_UPLOADS_FOLDER); 

async function ensureUploadDir() {
  if (!existsSync(SERVER_SAVE_DIR)) {
    await fs.mkdir(SERVER_SAVE_DIR, { recursive: true });
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

    // Walang kailangang baguhin dito, basta ang URL sa DB ay /uploads/profile_pictures/...
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
      
      // 2. SERVER SAVE PATH: Gamitin ang SERVER_SAVE_DIR para sa tamang server path.
      const filePath = path.join(SERVER_SAVE_DIR, newFileName);
      
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      // 3. DATABASE/PUBLIC URL: I-save ang public accessible path sa database.
      // Ito ay dapat magsimula sa '/uploads' dahil ang public folder ang base URL.
      profile_picture_url = `/uploads/profile_pictures/${newFileName}`; 

      if (oldProfileUrl && oldProfileUrl.startsWith('/uploads')) {
        // 4. OLD FILE DELETION: I-construct ang path na gagamitin ng FS, hindi ng browser.
        // Ang `oldProfileUrl` ay tulad ng '/uploads/profile_pictures/old.jpg'.
        // Kailangan natin i-combine ito sa BASE_APP_DIR.
        const relativeOldPath = oldProfileUrl.substring(1); // 'uploads/profile_pictures/old.jpg'
        const oldPicturePath = path.join(BASE_APP_DIR, relativeOldPath);

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

    // ... (rest of the update logic remains the same)
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