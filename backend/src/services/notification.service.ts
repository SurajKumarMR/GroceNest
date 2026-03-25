
import prisma from '../utils/prisma';
import { getIO } from './socket.service';

export const notificationService = {
    /**
     * Create a notification and send it via socket
     */
    createNotification: async (data: {
        userId: string;
        type: 'order' | 'promotion' | 'system' | 'review';
        title: string;
        message: string;
        data?: any;
    }) => {
        try {
            // 1. Save to database
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    data: data.data || {}
                }
            });

            // 2. Emit via socket to the user's private room
            const io = getIO();
            io.to(`user_${data.userId}`).emit('newNotification', notification);

            return notification;
        } catch (error) {
            console.error('Create notification error:', error);
            throw error;
        }
    },

    /**
     * Notify customer about order status change
     */
    notifyOrderStatusChange: async (orderId: string, status: string, userId: string) => {
        const statusMap: Record<string, string> = {
            'CONFIRMED': 'Your order has been confirmed!',
            'PREPARING': 'The store is preparing your order.',
            'READY': 'Your order is ready for pickup.',
            'OUT_FOR_DELIVERY': 'Your order is on the way!',
            'DELIVERED': 'Order delivered. Enjoy your meal!',
            'CANCELLED': 'Your order has been cancelled.'
        };

        const message = statusMap[status] || `Order status updated to ${status}`;

        await notificationService.createNotification({
            userId,
            type: 'order',
            title: 'Order Update',
            message,
            data: { orderId, status }
        });

        // Also broadcast the status update to the order's room for live UI badges
        const io = getIO();
        io.to(`order_${orderId}`).emit('statusUpdate', { orderId, status });
    },

    /**
     * Notify store owner about new order
     */
    notifyNewOrder: async (storeId: string, ownerId: string, orderNumber: string) => {
        await notificationService.createNotification({
            userId: ownerId,
            type: 'order',
            title: 'New Order Received',
            message: `You have a new order: #${orderNumber}`,
            data: { storeId }
        });
    }
};
