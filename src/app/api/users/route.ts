// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // --- DATABASE LOGIC ---
    // Gumagamit tayo ng array destructuring para makuha ang unang item (ang data rows)
    const [rows] = await db.query('SELECT id, first_name, last_name FROM users');
    
    // Ang `rows` na ngayon ang naglalaman ng iyong data
    return NextResponse.json(rows);

  } catch (error) {
    console.error('API Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}