"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = (0, next_1.default)({ dev, hostname, port, dir: '.' });
const handle = app.getRequestHandler();
const onlineUsers = {};
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)((req, res) => {
        try {
            if (!req.url)
                throw new Error('Request URL is not available.');
            const parsedUrl = (0, url_1.parse)(req.url, true);
            handle(req, res, parsedUrl);
        }
        catch (err) {
            console.error('Error occurred handling', req?.url, err);
            res.statusCode = 500;
            res.end('Internal server error');
        }
    });
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*', // You may want to restrict this in production
        },
    });
    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);
        socket.on('user-connected', (userId) => {
            if (userId) {
                onlineUsers[String(userId)] = socket.id;
                console.log(`✅ User ${userId} registered with socket ${socket.id}`);
            }
        });
        socket.on('join-private-room', (userId1, userId2) => {
            const roomName = [userId1, userId2].sort().join('-');
            socket.join(roomName);
            console.log(`👥 Socket ${socket.id} joined room ${roomName}`);
        });
        socket.on('private-message', async (data) => {
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
                const savedMessage = await response.json();
                const roomName = [senderId, receiverId].sort().join('-');
                io.to(roomName).emit('new-private-message', savedMessage);
                console.log(`📨 Message sent to room ${roomName}:`, savedMessage);
            }
            catch (err) {
                console.error('❌ Error in private-message handler:', err);
            }
        });
        socket.on('private-file-message', (savedMessage) => {
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
