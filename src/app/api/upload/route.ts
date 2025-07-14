import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createMessageInDb } from '@/lib/message-actions'; // Import the new function

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

const getContentType = (fileName: string): 'image' | 'video' | 'file' => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const extension = path.extname(fileName).toLowerCase();

  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  return 'file';
};

export async function POST(request: NextRequest) {
  await ensureUploadDir();

  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const senderId = data.get('senderId') as string;
    const receiverId = data.get('receiverId') as string;

    if (!file || !senderId || !receiverId) {
      return NextResponse.json({ error: 'Missing file or user IDs' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadPath = path.join(UPLOAD_DIR, filename);

    await writeFile(uploadPath, buffer);

    const fileUrl = `/uploads/${filename}`;
    const messageType = getContentType(file.name);
    const content = file.name;

    // Directly call the database function instead of using fetch
    const savedMessage = await createMessageInDb({
      senderId: Number(senderId),
      receiverId: Number(receiverId),
      messageType,
      fileUrl,
      content,
    });

    return NextResponse.json(savedMessage, { status: 201 });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}