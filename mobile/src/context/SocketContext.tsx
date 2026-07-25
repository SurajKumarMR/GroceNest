import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';
import { Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let activeSocket: Socket | null = null;

        if (user) {
            const connectSocket = async () => {
                activeSocket = await socketService.connect();
                setSocket(activeSocket);
                setIsConnected(activeSocket.connected);

                activeSocket.on?.('connect', () => setIsConnected(true));
                activeSocket.on?.('reconnect', () => setIsConnected(true));
                activeSocket.on?.('disconnect', () => setIsConnected(false));
                activeSocket.on?.('connect_error', () => setIsConnected(false));
            };
            connectSocket();
        } else {
            socketService.disconnect();
            setSocket(null);
            setIsConnected(false);
        }

        return () => {
            if (activeSocket) {
                activeSocket.off?.('connect');
                activeSocket.off?.('reconnect');
                activeSocket.off?.('disconnect');
                activeSocket.off?.('connect_error');
            }
            socketService.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
