// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// Helper to determine the content type for file messages
const getContentType = (fileName: string): 'image' | 'video' | 'file' => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const extension = path.extname(fileName).toLowerCase();

    if (imageExtensions.includes(extension)) {
        return 'image';
    }
    if (videoExtensions.includes(extension)) {
        return 'video';
    }
    return 'file';
};

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const senderId = data.get('senderId') as string;
        const receiverId = data.get('receiverId') as string;

        if (!file || !senderId || !receiverId) {
            return NextResponse.json({ error: 'Missing file or user IDs' }, { status: 400 });
        }

        // 1. Save the file to the server's filesystem
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename to avoid conflicts
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const uploadPath = path.join(process.cwd(), 'public/uploads', filename);
        
        await writeFile(uploadPath, buffer);
        console.log(`File saved to: ${uploadPath}`);

        // 2. Create the URL path for the client to access the file
        const fileUrl = `/uploads/${filename}`;
        const messageType = getContentType(file.name);
        const content = file.name; // Use the original file name as the content for display purposes

        // 3. Call the message API to save this file message to the database
        const apiRoute = new URL('/api/messages', request.url).toString();
        
        const response = await fetch(apiRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: Number(senderId),
                receiverId: Number(receiverId),
                messageType,
                fileUrl,
                content // This will be the filename, e.g., "document.pdf"
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Failed to save file message:", errorBody);
            return NextResponse.json({ error: 'Failed to save message record' }, { status: 500 });
        }

        // The message API returns the final, complete message object
        const savedMessage = await response.json();

        // Return the complete message object so the client can use it for real-time emission
        return NextResponse.json(savedMessage, { status: 201 });

    } catch (error) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }
}