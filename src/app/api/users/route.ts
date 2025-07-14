// // src/app/api/users/route.ts
// import { NextResponse } from 'next/server';
// import db from '@/lib/db';

// export async function GET() {
//   try {
//     // The result from 'pg' is an object, so we destructure { rows }
//     const { rows } = await db.query(
//       'SELECT id, first_name, last_name, profile_picture_url FROM users'
//     );
    
//     return NextResponse.json(rows);

//   } catch (error) {
//     console.error('API Error fetching users:', error);
//     return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
//   }
// }

// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db'; // assumed to be mysql2 pool/connection

export async function GET() {
  try {
    // Destructure rows from the mysql2 response tuple
    const [rows] = await db.query(
      'SELECT id, first_name, last_name, profile_picture_url FROM users'
    );

    return NextResponse.json(rows);

  } catch (error) {
    console.error('API Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
