// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db'; // Your database client
import { RowDataPacket } from 'mysql2';

// --- GET: Kumuha ng conversation history (No changes needed here) ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId1 = searchParams.get('userId1');
  const userId2 = searchParams.get('userId2');

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

// --- POST: Mag-save ng bagong private message (UPDATED) ---
export async function POST(request: Request) {
    try {
        const { content, senderId, receiverId } = await request.json();

        if (!content || !senderId || !receiverId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Using a transaction to ensure both operations succeed or fail together
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Step 1: Insert the new message
            const insertQuery = `
                INSERT INTO messages (content, sender_id, receiver_id) 
                VALUES (?, ?, ?);
            `;
            const [insertResult] = await connection.query(insertQuery, [content, senderId, receiverId]);
            
            const lastInsertId = (insertResult as any).insertId;

            if (!lastInsertId) {
                await connection.rollback();
                return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
            }

            // Step 2: Fetch the complete message object that was just saved
            const selectQuery = `
                SELECT m.id, m.content, m.created_at, m.sender_id, u.first_name as username
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.id = ?;
            `;
            const [newMessages] = await connection.query(selectQuery, [lastInsertId]) as [RowDataPacket[], any];

            await connection.commit();

            if (newMessages.length === 0) {
                return NextResponse.json({ error: 'Failed to retrieve saved message' }, { status: 500 });
            }
            
            // Return the complete message object, which includes the database-generated id and created_at
            return NextResponse.json(newMessages[0]);

        } catch (dbError) {
            await connection.rollback(); // Rollback on error
            throw dbError; // Rethrow to be caught by the outer catch block
        } finally {
            connection.release(); // Always release the connection
        }

    } catch (error) {
        console.error('API Error saving message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}