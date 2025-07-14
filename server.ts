// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port, dir: '.' });
const handle = app.getRequestHandler();

// Stores online users: { userId: socketId }
const onlineUsers: Record<string, string> = {};

// Interface for a new text message payload from the client
interface MessagePayload {
    content?: string;
    senderId: number;
    receiverId: number;
}

// Interface for the complete message object returned by the API
// This object is used for broadcasting to ensure clients have all needed info.
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

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        try {
            if (!req.url) throw new Error('Request URL is not available.');
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer);

    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);

        // Map userId to socket.id when a user connects
        socket.on('user-connected', (userId: number) => {
            console.log(`User ${userId} registered with socket ${socket.id}`);
            if (userId) {
                onlineUsers[String(userId)] = socket.id;
            }
        });

        // Join a private room based on the two user IDs
        socket.on('join-private-room', (userId1: number, userId2: number) => {
            const roomName = [userId1, userId2].sort().join('-');
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room ${roomName}`);
        });

        // Handler for TEXT messages
        socket.on('private-message', async (data: MessagePayload) => {
            const { content, senderId, receiverId } = data;
            
            try {
                // Persist the message to the database by calling our own API
                const response = await fetch(`http://${hostname}:${port}/api/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, senderId, receiverId, messageType: 'text' }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`API request failed: ${response.status} - ${errorBody}`);
                }

                const savedMessage: SavedMessage = await response.json();
                const roomName = [senderId, receiverId].sort().join('-');
                
                // Broadcast the final, saved message to all clients in the room
                io.to(roomName).emit('new-private-message', savedMessage);
                console.log(`Message broadcasted to room ${roomName}:`, savedMessage);

            } catch (error) {
                console.error("Failed to save or broadcast text message:", error);
            }
        });

        // Handler for FILE messages
        socket.on('private-file-message', (savedMessage: SavedMessage) => {
            // This event is triggered by the client AFTER a successful file upload
            if (!savedMessage || !savedMessage.sender_id || !savedMessage.receiver_id) {
                 console.error("Invalid file message payload received", savedMessage);
                 return;
            }
            
            const roomName = [savedMessage.sender_id, savedMessage.receiver_id].sort().join('-');
            
            // Broadcast the file message to all clients in the room
            io.to(roomName).emit('new-private-message', savedMessage);
            console.log(`File Message broadcasted to room ${roomName}:`, savedMessage);
        });

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
            for (const userId in onlineUsers) {
                if (onlineUsers[userId] === socket.id) {
                    delete onlineUsers[userId];
                    console.log(`User ${userId} unregistered`);
                    break;
                }
            }
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    }).on('error', (err) => {
        throw err;
    });

}).catch((err) => {
    console.error('Error during Next.js preparation:', err);
    process.exit(1);
});