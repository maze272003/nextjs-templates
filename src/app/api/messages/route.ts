import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createMessageInDb } from '@/lib/message-actions';

// ... (your MessageRow interface can remain here if you want)

export async function GET(request: NextRequest) {
  // GET logic remains the same...
  const { searchParams } = new URL(request.url);
  const userId1 = searchParams.get('userId1');
  const userId2 = searchParams.get('userId2');

  if (!userId1 || !userId2) {
    return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
  }

  try {
    const query = `
      SELECT 
        m.id, m.content, m.created_at, m.sender_id, m.receiver_id, m.message_type, m.file_url,
        u.first_name as username, u.profile_picture_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $3 AND m.receiver_id = $4)
      ORDER BY m.created_at ASC
    `;
    const { rows: messages } = await db.query(query, [userId1, userId2, userId2, userId1]);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('API Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call the reusable function to handle the database logic
    const savedMessage = await createMessageInDb(body);

    return NextResponse.json(savedMessage);
  } catch (error) {
    console.error('API Error saving message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}