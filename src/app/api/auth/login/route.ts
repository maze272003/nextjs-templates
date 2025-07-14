// // src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  is_verified: number; // or boolean if casted
}

export async function POST(req: NextRequest) {
  try {
    const { email, password }: { email: string; password: string } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Correctly type and destructure the result from pool.execute
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, email, password, is_verified FROM users WHERE email = ?',
      [email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.is_verified) {
      return NextResponse.json(
        {
          message: 'Account not verified. Please verify your email.',
          redirectTo: `/verify-otp?userId=${user.id}`,
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json(
      { message: 'Login successful', user: { id: user.id, email: user.email } },
      { status: 200 }
    );

    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60,
      path: '/',
    });

    response.cookies.set('user_id', user.id.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/auth/login/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import pool from '@/lib/db';
// import bcrypt from 'bcrypt';
// import { QueryResult } from 'pg'; // Import QueryResult for typing if needed

// // Define a clean interface for our user data from PostgreSQL
// interface UserRow {
//   id: number;
//   email: string;
//   password: string;
//   is_verified: boolean; // Changed from number to boolean
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password }: { email: string; password: string } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
//     }

//     // Use pool.query with $1 placeholder and correct typing
//     const result: QueryResult<UserRow> = await pool.query(
//       'SELECT id, email, password, is_verified FROM users WHERE email = $1',
//       [email]
//     );

//     const user = result.rows[0];

//     if (!user) {
//       return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//     }

//     const passwordMatch = await bcrypt.compare(password, user.password);
//     if (!passwordMatch) {
//       return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
//     }

//     // The 'is_verified' check now correctly uses a boolean
//     if (!user.is_verified) {
//       return NextResponse.json(
//         {
//           message: 'Account not verified. Please verify your email.',
//           redirectTo: `/verify-otp?userId=${user.id}`,
//         },
//         { status: 403 }
//       );
//     }

//     const response = NextResponse.json(
//       { message: 'Login successful', user: { id: user.id, email: user.email } },
//       { status: 200 }
//     );

//     // This cookie logic remains the same
//     response.cookies.set('isAuthenticated', 'true', {
//       httpOnly: false,
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 60 * 60,
//       path: '/',
//     });

//     response.cookies.set('user_id', user.id.toString(), {
//       httpOnly: false,
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 60 * 60,
//       path: '/',
//     });

//     return response;

//   } catch (error) {
//     console.error('Login error:', error);
//     return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
//   }
// }