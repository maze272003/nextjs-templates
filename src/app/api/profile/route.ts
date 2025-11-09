import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { RowDataPacket } from 'mysql2'; // Kept for interface extension, will fix lint below

// 1. I-configure ang Base Directory: "/app" ang root ng iyong application sa Coolify container.
// Ang 'public' folder ay nasa loob ng /app.
const BASE_APP_DIR = process.cwd(); 
const PUBLIC_UPLOADS_FOLDER = 'public/uploads/profile_pictures'; 
// Ang SERVER_SAVE_DIR ay ang full path sa loob ng Volume Mount (e.g., /app/public/uploads/profile_pictures)
const SERVER_SAVE_DIR = path.join(BASE_APP_DIR, PUBLIC_UPLOADS_FOLDER); 

async function ensureUploadDir() {
  if (!existsSync(SERVER_SAVE_DIR)) {
    console.log(`Creating directory: ${SERVER_SAVE_DIR}`);
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
// FIX: Pinalitan ang 'req' ng '_req' sa parameter, pero ginamit ang orihinal na 'req' 
// sa loob ng function dahil kailangan mo ang 'req.url'.
// Dahil ang Next.js App Router ay ginagamit ang request object kahit mayroon kang 'GET' parameter,
// ang pagkuha ng URL sa ganitong paraan ay tama.
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
      
      // 2. SERVER SAVE PATH: Gamitin ang SERVER_SAVE_DIR para sa tamang server path.
      const filePath = path.join(SERVER_SAVE_DIR, newFileName);
      
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      // 💡 Potential Permission Issue happens here:
      await fs.writeFile(filePath, buffer);
      
      // 3. DATABASE/PUBLIC URL: I-save ang public accessible path sa database.
      profile_picture_url = `/uploads/profile_pictures/${newFileName}`; 

      if (oldProfileUrl && oldProfileUrl.startsWith('/uploads')) {
        // 4. OLD FILE DELETION: I-construct ang path na gagamitin ng FS, hindi ng browser.
        const oldPicturePath = path.join(BASE_APP_DIR, oldProfileUrl.substring(1));

        try {
          console.log(`Attempting to delete old file at: ${oldPicturePath}`);
          await fs.unlink(oldPicturePath);
          console.log('✅ Old profile picture deleted successfully.');
        } catch (unlinkError: unknown) {
          if (
            unlinkError &&
            typeof unlinkError === 'object' &&
            'code' in unlinkError &&
            (unlinkError as { code: string }).code !== 'ENOENT'
          ) {
            // EACCES = Permission denied. Ito ang susi sa Volume Write Issue.
            console.error(`❌ CRITICAL UNLINK ERROR (Check Volume Permissions):`, unlinkError);
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
    return NextResponse.json({ message: 'Internal server error (Check Coolify logs for I/O errors)' }, { status: 500 });
  }
}