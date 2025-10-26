// api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; 
import { RowDataPacket } from 'mysql2';
// 🔄 Import ang 'path' at 'fs/promises' para sa lokal na file operations (Railway Volume)
import path from 'path';
import { writeFile, access } from 'fs/promises';
import { constants } from 'fs'; 

// 📌 TUKUYIN ANG BASE UPLOAD DIRECTORY
// Ito ang absolute path sa loob ng container, na naka-mount sa iyong Railway Volume.
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Extend mysql2's RowDataPacket for proper type support
interface UserProfile extends RowDataPacket {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
}

/**
 * 🔍 GET /api/profile?userId=123
 * Kinukuha ang profile information ng isang user.
 */
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

/**
 * 🛠️ PUT /api/profile?userId=123
 * Ina-update ang profile information, kasama na ang pag-upload ng profile picture sa Railway Volume.
 */
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

    // --- Railwat Volume Upload Logic ---
    const profilePictureFile = formData.get('profilePicture') as File | null;

    if (profilePictureFile && profilePictureFile.size > 0) {
      console.log('Uploading profile picture to Railway Volume...');
      
      // I-convert ang file sa Buffer
      const bytes = await profilePictureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Gumawa ng unique filename
      const fileExtension = path.extname(profilePictureFile.name);
      // Gumamit ng userId at timestamp para sa uniqueness
      const uniqueFileName = `${Date.now()}-${userId}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFileName);

      // Tiyakin na mayroon ang UPLOAD_DIR (bagamat dapat ay mayroon na dahil sa volume mount)
      try {
        await access(UPLOAD_DIR, constants.W_OK);
      } catch {
        // Pwede mong idagdag ang logic para gumawa ng directory kung wala, 
        // pero sa Railway Volume setup, dapat ay laging available ito.
        console.warn('Upload directory not found or writable. Check Volume setup.');
      }
      
      // 1. Isulat ang file sa Volume
      await writeFile(filePath, buffer);

      // 2. Ang URL ay ang public path para ma-access ang image.
      profile_picture_url = `/uploads/${uniqueFileName}`;
      
      console.log('Upload complete. Local URL:', profile_picture_url);
    }
    // --- End of Upload Logic ---

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
// ASASAS