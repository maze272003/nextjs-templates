import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db'; // Your database client
import { RowDataPacket } from 'mysql2';

// --- GET: Kumuha ng conversation history ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId1 = searchParams.get('userId1');
  const userId2 = searchParams.get('userId2'); // <-- Ito ang inayos (This was the fix)

  if (!userId1 || !userId2) {
    return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
  }

  try {
    const query = `
        SELECT m.id, m.content, m.created_at, m.sender_id, u.first_name as username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC;
    `;
    const values = [userId1, userId2, userId2, userId1];
    
    const [messages] = await db.query(query, values) as [RowDataPacket[], any];

    return NextResponse.json(messages);

  } catch (error) {
    console.error('API Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// --- POST: Mag-save ng bagong private message ---
export async function POST(request: Request) {
    try {
        const { content, senderId, receiverId } = await request.json();

        if (!content || !senderId || !receiverId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // --- MySQL logic for INSERT then SELECT ---
        const insertQuery = `
            INSERT INTO messages (content, sender_id, receiver_id) 
            VALUES (?, ?, ?);
        `;
        // Execute the insert, we don't need the result for this line
        await db.query(insertQuery, [content, senderId, receiverId]);

        // Now, get the user's name
        const userResultQuery = 'SELECT first_name FROM users WHERE id = ?';
        
        // 3. IDAGDAG DIN DITO ANG "as [RowDataPacket[], any]"
        const [userRows] = await db.query(userResultQuery, [senderId]) as [RowDataPacket[], any];
        
        // Check if user was found before accessing the first element
        const username = userRows && userRows.length > 0 ? userRows[0].first_name : 'User';
        
        // Return the object that was sent, now with the username
        return NextResponse.json({ content, sender_id: senderId, username });

    } catch (error) {
        console.error('API Error saving message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}