
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
        if (user) {
            const connectSocket = async () => {
                const s = await socketService.connect();
                setSocket(s);
                setIsConnected(true);
            };
            connectSocket();
        } else {
            socketService.disconnect();
            setSocket(null);
            setIsConnected(false);
        }

        return () => {
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
