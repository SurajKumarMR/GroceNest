
import { Server as SocketServer } from 'socket.io';
import * as http from 'http';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

let io: SocketServer;

export const initSocket = (server: http.Server) => {
    io = new SocketServer(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            (socket as any).userId = decoded.userId;
            (socket as any).role = decoded.role;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id} (${(socket as any).userId})`);

        // Join a room specifically for an order
        socket.on('joinOrder', (orderId: string) => {
            socket.join(`order_${orderId}`);
            console.log(`User connected to order room: order_${orderId}`);
        });

        // Join a room for a store (merchants)
        socket.on('joinStore', (storeId: string) => {
            socket.join(`store_${storeId}`);
            console.log(`Merchant connected to store room: store_${storeId}`);
        });

        // Driver sending location updates
        socket.on('updateLocation', (data: { orderId: string, latitude: number, longitude: number, heading?: number }) => {
            const { orderId, latitude, longitude, heading } = data;

            // Only drivers assigned to the order should be able to update location
            // For now, we trust the client or we could verify driverId against DB

            io.to(`order_${orderId}`).emit('locationUpdated', {
                latitude,
                longitude,
                heading,
                timestamp: new Date()
            });
        });

        socket.on('joinSupport', (data: { userId: string }) => {
            const userId = data.userId || (socket as any).userId;
            socket.join(`support_${userId}`);
            console.log(`User joined support room: support_${userId}`);
        });

        socket.on('sendSupportMessage', async (data: { sessionId: string, content: string, isAdmin?: boolean }) => {
            const { sessionId, content, isAdmin } = data;
            const userId = (socket as any).userId;

            // In a real app, we would save to DB here
            // But for now, we just broadcast to the room
            io.to(`support_${userId}`).emit('newSupportMessage', {
                sessionId,
                senderId: userId,
                content,
                isAdmin: !!isAdmin,
                createdAt: new Date()
            });
            
            // Also notify admins
            io.to('support_admins').emit('adminNewMessage', {
                userId,
                sessionId,
                content
            });
        });

        socket.on('adminJoinSupport', (data: { userId: string }) => {
            if ((socket as any).role === 'ADMIN') {
                socket.join(`support_${data.userId}`);
                socket.join('support_admins');
                console.log(`Admin joined support room: support_${data.userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
