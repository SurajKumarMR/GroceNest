
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export interface LocationUpdateData {
    latitude: number;
    longitude: number;
    heading?: number;
}

export const socketService = {
    connect: (token: string) => {
        if (socket?.connected) return socket;

        socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000", {
            auth: { token },
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            console.log("Web Socket connected:", socket?.id);
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
        socket?.emit("joinOrder", orderId);
    },

    onLocationUpdated: (callback: (data: LocationUpdateData) => void) => {
        socket?.on("locationUpdated", callback);
    },

    offLocationUpdated: () => {
        socket?.off("locationUpdated");
    },
};
