
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export interface Notification {
    id: string;
    type: "order" | "promotion" | "system" | "review";
    title: string;
    message: string;
    data: unknown;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get<Notification[]>("/notifications");
                setNotifications(data);
            } catch (error) {
                console.error("Fetch notifications error:", error);
            }
        };

        if (isAuthenticated && user) {
            const token = localStorage.getItem("token");
            if (token) {
                const socket = socketService.connect(token);

                // Listen for user's personal room notifications
                socket.emit("joinUser", user.id); // We should add this on server too or use private room
                // Actually our server implementation used user_id room automatically on connection but 
                // let's adjust server to join user_id room or just use what we have.
                // My server code: io.to(`user_${data.userId}`).emit('newNotification', notification);
                // Wait, I need to make the socket join `user_${userId}` room on connection.

                socket.on("newNotification", (notification: Notification) => {
                    setNotifications((prev) => [notification, ...prev]);
                });

                // Initial fetch
                fetchNotifications();
            }
        } else {
            Promise.resolve().then(() => setNotifications([]));
            socketService.disconnect();
        }
    }, [isAuthenticated, user]);


    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error("Mark as read error:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch("/notifications/mark-all-read");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Mark all as read error:", error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
