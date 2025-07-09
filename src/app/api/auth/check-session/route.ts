import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Kunin ang user ID mula sa cookie na sinet natin kanina
  const userId = req.cookies.get('user_id')?.value;

  if (!userId) {
    // Kung walang cookie, hindi siya naka-login
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Kung may cookie, ibalik ang user ID
  return NextResponse.json({ userId: userId }, { status: 200 });
}