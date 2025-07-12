import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get user ID from the cookie we set during login or OTP verification
  const userId = req.cookies.get('user_id')?.value;

  if (!userId) {
    // If there's no cookie, the user is not logged in
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // If there is a cookie, return the user ID
  return NextResponse.json({ userId: userId }, { status: 200 });
}