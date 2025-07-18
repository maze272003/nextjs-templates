import db from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2';

interface CreateMessageData {
  content: string | null;
  senderId: number;
  receiverId: number;
  messageType?: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string | null;
}

interface SavedMessage extends RowDataPacket {
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

export async function createMessageInDb({
  content,
  senderId,
  receiverId,
  messageType = 'text',
  fileUrl = null,
}: CreateMessageData): Promise<SavedMessage> {
  try {
    const [insertResult] = await db.query<OkPacket>(
      `INSERT INTO messages (content, sender_id, receiver_id, message_type, file_url)
       VALUES (?, ?, ?, ?, ?)`,
      [content, senderId, receiverId, messageType, fileUrl]
    );

    const newMessageId = insertResult.insertId;
    if (!newMessageId) throw new Error('Failed to insert message.');

    const [rows] = await db.query<SavedMessage[]>(
      `SELECT
         m.id, m.content, m.created_at, m.sender_id, m.receiver_id, m.message_type, m.file_url,
         u.first_name as username, u.profile_picture_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [newMessageId]
    );

    const savedMessage = rows[0];
    if (!savedMessage) throw new Error('Message not found after insert.');

    return savedMessage;
  } catch (error: unknown) {
    console.error('Database operation failed:', error);
    throw error;
  }
}
