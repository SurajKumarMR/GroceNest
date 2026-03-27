
import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';
import { useAuth } from './AuthContext';
import api from '../services/api';

export interface Notification {
    id: string;
    type: 'order' | 'promotion' | 'system' | 'review';
    title: string;
    message: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    refreshNotifications: async () => { },
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        let socket: any;
        if (isAuthenticated && user) {
            const setupSocket = async () => {
                socket = await socketService.connect();

                socket.on('newNotification', (notification: Notification) => {
                    setNotifications((prev) => [notification, ...prev]);
                });

                // Also listen for status updates for any active orders
                socket.on('statusUpdate', (data: { orderId: string, status: string }) => {
                    // This could be handled locally by screens, but keeping it here
                    // for global state if needed
                    console.log('[Mobile Socket] Status update:', data);
                });
            };

            setupSocket();
            refreshNotifications();
        } else {
            setNotifications([]);
        }

        return () => {
            if (socket) {
                socket.off('newNotification');
                socket.off('statusUpdate');
            }
        };
    }, [isAuthenticated, user]);

    const refreshNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Mark all as read error:', error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
