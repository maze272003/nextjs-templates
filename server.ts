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

const onlineUsers: Record<string, string> = {};

interface MessagePayload {
  content?: string;
  senderId: number;
  receiverId: number;
}

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
      console.error('Error occurred handling', req?.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*', // You may want to restrict this in production
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('user-connected', (userId: number) => {
      if (userId) {
        onlineUsers[String(userId)] = socket.id;
        console.log(`✅ User ${userId} registered with socket ${socket.id}`);
      }
    });

    socket.on('join-private-room', (userId1: number, userId2: number) => {
      const roomName = [userId1, userId2].sort().join('-');
      socket.join(roomName);
      console.log(`👥 Socket ${socket.id} joined room ${roomName}`);
    });

    socket.on('private-message', async (data: MessagePayload) => {
      const { content, senderId, receiverId } = data;

      if (!senderId || !receiverId || typeof content !== 'string') {
        console.warn('🚫 Invalid private-message payload:', data);
        return;
      }

      try {
        const response = await fetch(`http://${hostname}:${port}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, senderId, receiverId, messageType: 'text' }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API failed: ${response.status} - ${errorText}`);
        }

        const savedMessage: SavedMessage = await response.json();
        const roomName = [senderId, receiverId].sort().join('-');
        io.to(roomName).emit('new-private-message', savedMessage);
        console.log(`📨 Message sent to room ${roomName}:`, savedMessage);
      } catch (err) {
        console.error('❌ Error in private-message handler:', err);
      }
    });

    socket.on('private-file-message', (savedMessage: SavedMessage) => {
      if (!savedMessage?.sender_id || !savedMessage?.receiver_id) {
        console.warn('🚫 Invalid file message payload:', savedMessage);
        return;
      }

      const roomName = [savedMessage.sender_id, savedMessage.receiver_id].sort().join('-');
      io.to(roomName).emit('new-private-message', savedMessage);
      console.log(`📁 File message sent to room ${roomName}:`, savedMessage);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);

      for (const [userId, socketId] of Object.entries(onlineUsers)) {
        if (socketId === socket.id) {
          delete onlineUsers[userId];
          console.log(`🗑️ User ${userId} unregistered`);
          break;
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Ready on http://${hostname}:${port}`);
  }).on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('❌ Error during Next.js app.prepare():', err);
  process.exit(1);
});
