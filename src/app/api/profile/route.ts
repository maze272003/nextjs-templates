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
    console.log(`Creating directory: ${SERVER_SAVE_DIR}`);
    await fs.mkdir(SERVER_SAVE_DIR, { recursive: true });
  }
}

// ... (Interfaces remain the same)

// GET /api/profile?userId=123
export async function GET(req: NextRequest) {
  // ... (GET logic remains the same - no file handling involved)
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

      // --- 4. OLD FILE DELETION LOGIC (IMPROVED ERROR HANDLING) ---
      if (oldProfileUrl && oldProfileUrl.startsWith('/uploads')) {
        // Tiyakin na ang deletion path ay tama (alisin ang leading slash)
        const oldPicturePath = path.join(BASE_APP_DIR, oldProfileUrl.substring(1));

        try {
          console.log(`Attempting to delete old file at: ${oldPicturePath}`);
          await fs.unlink(oldPicturePath);
          console.log('✅ Old profile picture deleted.');
        } catch (unlinkError: unknown) {
          if (
            unlinkError &&
            typeof unlinkError === 'object' &&
            'code' in unlinkError &&
            (unlinkError as { code: string }).code !== 'ENOENT'
          ) {
            // EACCES = Permission denied. Ito ang hinahanap natin.
            console.error(`❌ CRITICAL UNLINK ERROR (Check Volume Permissions):`, unlinkError);
            // Huwag itong i-rethrow para tuloy ang upload ng bagong file
          }
        }
      }
      
      // --- 5. NEW FILE WRITE LOGIC ---
      const newFileName = `${userId}_${Date.now()}${path.extname(profilePictureFile.name)}`;
      const filePath = path.join(SERVER_SAVE_DIR, newFileName);
      
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      // DATABASE/PUBLIC URL: I-save ang public accessible path sa database.
      profile_picture_url = `/uploads/profile_pictures/${newFileName}`; 
    }

    // ... (rest of the update and DB logic remains the same)
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
    // Mas detalyado ang error message kung I/O related
    return NextResponse.json({ message: 'Internal server error (Check logs for EACCES or other I/O errors)' }, { status: 500 });
  }
}