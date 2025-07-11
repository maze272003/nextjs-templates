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

// Nag-iimbak ng online users: { userId: socketId }
const onlineUsers: Record<string, string> = {};

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

    // 1. Itago ang user ID kapag kumonekta
    socket.on('user-connected', (userId: number) => {
        console.log(`User ${userId} registered with socket ${socket.id}`);
        if (userId) {
            onlineUsers[String(userId)] = socket.id;
        }
    });

    // 2. Gumawa ng private room
    socket.on('join-private-room', (userId1: number, userId2: number) => {
        // Gumawa ng consistent na room name
        const roomName = [userId1, userId2].sort().join('-');
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    // 3. Magpadala ng private message (UPDATED)
    socket.on('private-message', async (data) => {
      const { content, senderId, receiverId } = data; // We only need these for the API call
      
      try {
        // I-save sa DB via API. The API now returns the *complete* message object.
        const response = await fetch(`http://${hostname}:${port}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, senderId, receiverId }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorBody}`);
        }

        // The API now returns the full object with id, created_at, username, etc.
        const savedMessageWithDetails = await response.json();

        // I-broadcast sa tamang room
        const roomName = [senderId, receiverId].sort().join('-');
        
        // Emit the complete object directly.
        io.to(roomName).emit('new-private-message', savedMessageWithDetails);
        console.log(`Message broadcasted to room ${roomName}:`, savedMessageWithDetails);

      } catch (error) {
          console.error("Failed to save or broadcast message:", error);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      // Alisin ang user sa online list
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
  });
}).catch((err) => {
    console.error('Error during Next.js preparation:', err);
    process.exit(1);
});