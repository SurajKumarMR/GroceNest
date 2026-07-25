import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { SOCKET_URL as ENV_SOCKET_URL } from '@env';

const SOCKET_URL = ENV_SOCKET_URL || 'http://localhost:8000';

let socket: Socket | null = null;
const joinedOrderRooms: Set<string> = new Set();
const offlineQueue: Array<{ event: string; data: any }> = [];

export const socketService = {
    connect: async (): Promise<Socket> => {
        if (socket?.connected) return socket;

        if (socket) {
            // Already initialized socket instance
            socket.connect();
            return socket;
        }

        const token = await AsyncStorage.getItem('token');

        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[Mobile Socket] Connected successfully:', socket?.id);
            socketService.flushOfflineQueue();
            socketService.rejoinRooms();
        });

        socket.on('reconnect', (attemptNumber: number) => {
            console.log(`[Mobile Socket] Reconnected on attempt #${attemptNumber}`);
            socketService.rejoinRooms();
            socketService.flushOfflineQueue();
        });

        socket.on('reconnect_attempt', (attempt: number) => {
            console.log(`[Mobile Socket] Reconnection attempt #${attempt}...`);
        });

        socket.on('reconnect_error', (error: any) => {
            console.warn('[Mobile Socket] Reconnection error:', error.message || error);
        });

        socket.on('connect_error', (error: any) => {
            console.error('[Mobile Socket] Connection error:', error.message || error);
        });

        socket.on('disconnect', (reason: string) => {
            console.warn(`[Mobile Socket] Disconnected. Reason: ${reason}`);
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        joinedOrderRooms.clear();
        offlineQueue.length = 0;
    },

    emit: (event: string, data: any) => {
        if (socket && socket.connected) {
            socket.emit(event, data);
        } else {
            console.log(`[Mobile Socket] Disconnected. Queueing event '${event}'`);
            offlineQueue.push({ event, data });
        }
    },

    flushOfflineQueue: () => {
        if (!socket || !socket.connected || offlineQueue.length === 0) return;
        console.log(`[Mobile Socket] Flushing ${offlineQueue.length} queued offline events...`);
        while (offlineQueue.length > 0) {
            const item = offlineQueue.shift();
            if (item) {
                socket.emit(item.event, item.data);
            }
        }
    },

    rejoinRooms: () => {
        if (!socket || !socket.connected || joinedOrderRooms.size === 0) return;
        console.log(`[Mobile Socket] Rejoining ${joinedOrderRooms.size} active order rooms...`);
        joinedOrderRooms.forEach((orderId) => {
            socket?.emit('joinOrder', orderId);
        });
    },

    joinOrder: (orderId: string) => {
        if (!orderId) return;
        joinedOrderRooms.add(orderId);
        if (socket && socket.connected) {
            socket.emit('joinOrder', orderId);
        } else {
            offlineQueue.push({ event: 'joinOrder', data: orderId });
        }
    },

    leaveOrder: (orderId: string) => {
        if (!orderId) return;
        joinedOrderRooms.delete(orderId);
        if (socket && socket.connected) {
            socket.emit('leaveOrder', orderId);
        }
    },

    updateLocation: (orderId: string, latitude: number, longitude: number, heading?: number) => {
        const payload = { orderId, latitude, longitude, heading };
        socketService.emit('updateLocation', payload);
    },

    onLocationUpdated: (callback: (data: any) => void) => {
        socket?.on('locationUpdated', callback);
    },

    offLocationUpdated: () => {
        socket?.off('locationUpdated');
    },

    getQueuedEventsCount: (): number => offlineQueue.length,

    getJoinedRooms: (): string[] => Array.from(joinedOrderRooms),

    getSocketInstance: (): Socket | null => socket,
};
