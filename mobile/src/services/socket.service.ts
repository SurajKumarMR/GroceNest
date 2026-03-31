import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { SOCKET_URL as ENV_SOCKET_URL } from '@env';

const SOCKET_URL = ENV_SOCKET_URL || 'http://localhost:8000';

let socket: Socket | null = null;

export const socketService = {
    connect: async () => {
        if (socket?.connected) return socket;

        const token = await AsyncStorage.getItem('token');

        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'], // Use websocket for better performance
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    joinOrder: (orderId: string) => {
        socket?.emit('joinOrder', orderId);
    },

    updateLocation: (orderId: string, latitude: number, longitude: number, heading?: number) => {
        socket?.emit('updateLocation', { orderId, latitude, longitude, heading });
    },

    onLocationUpdated: (callback: (data: any) => void) => {
        socket?.on('locationUpdated', callback);
    },

    offLocationUpdated: () => {
        socket?.off('locationUpdated');
    }
};
