import db from '@/lib/db';

// Interface for the data needed to create a message
interface CreateMessageData {
  content: string | null;
  senderId: number;
  receiverId: number;
  messageType?: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string | null;
}

// Interface for the complete message object we expect back from the database
interface SavedMessage {
  id: number;
  content: string | null;
  created_at: string;
  sender_id: number;
  receiver_id: number;
  message_type: 'text' | 'image' | 'video' | 'file';
  file_url: string | null;
  username: string;
  profile_picture_url: string | null;
}

// This function handles the database transaction to create and fetch a message
export async function createMessageInDb({
  content,
  senderId,
  receiverId,
  messageType = 'text',
  fileUrl = null,
}: CreateMessageData): Promise<SavedMessage> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO messages (content, sender_id, receiver_id, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const insertResult = await client.query<{ id: number }>(insertQuery, [
      content,
      senderId,
      receiverId,
      messageType,
      fileUrl,
    ]);

    if (insertResult.rowCount === 0) {
      throw new Error('Failed to insert message into database.');
    }

    const newMessageId = insertResult.rows[0].id;

    const selectQuery = `
      SELECT
        m.id, m.content, m.created_at, m.sender_id, m.receiver_id, m.message_type, m.file_url,
        u.first_name as username, u.profile_picture_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `;
    const newMessagesResult = await client.query<SavedMessage>(selectQuery, [newMessageId]);

    await client.query('COMMIT');

    return newMessagesResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction failed:', error);
    throw error; // Re-throw the error to be caught by the API route
  } finally {
    client.release();
  }
}