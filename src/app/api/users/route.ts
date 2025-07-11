// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // FIX: Add profile_picture_url to the SELECT statement.
    // Make sure your 'users' table has a column named 'profile_picture_url'.
    const [rows] = await db.query(
      'SELECT id, first_name, last_name, profile_picture_url FROM users'
    );
    
    return NextResponse.json(rows);

  } catch (error) {
    console.error('API Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}