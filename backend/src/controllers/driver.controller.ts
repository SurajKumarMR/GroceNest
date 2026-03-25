
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { OrderStatus } from '@prisma/client';
import { notificationService } from '../services/notification.service';

export const getAvailableOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.READY,
                driverId: null
            },
            include: {
                store: true,
                deliveryAddress: true,
                user: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        res.json(orders);
    } catch (error) {
        console.error('Get available orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;

        if (!userId || !orderId || typeof orderId !== 'string') {
            res.status(400).json({ error: 'Invalid request' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, driverId: true, userId: true }
        });

        if (!order || order.status !== OrderStatus.READY || order.driverId) {
            res.status(400).json({ error: 'Order not available' });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                driverId: userId,
                status: OrderStatus.OUT_FOR_DELIVERY,
                driverAssignedAt: new Date(),
                statusHistory: {
                    create: {
                        status: OrderStatus.OUT_FOR_DELIVERY,
                        note: 'Order picked up by driver',
                        createdBy: userId
                    }
                }
            }
        });

        // Notify customer
        if (order.userId) {
            await notificationService.notifyOrderStatusChange(orderId, OrderStatus.OUT_FOR_DELIVERY, order.userId);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Accept order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deliverOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const orderId = req.params.orderId;

        if (!userId || !orderId || typeof orderId !== 'string') {
            res.status(400).json({ error: 'Invalid request' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, driverId: true, userId: true }
        });

        if (!order || order.driverId !== userId) {
            res.status(403).json({ error: 'Not authorized or order not found' });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.DELIVERED,
                deliveredAt: new Date(),
                statusHistory: {
                    create: {
                        status: OrderStatus.DELIVERED,
                        note: 'Order delivered successfully',
                        createdBy: userId
                    }
                }
            }
        });

        // Notify customer
        if (order.userId) {
            await notificationService.notifyOrderStatusChange(orderId, OrderStatus.DELIVERED, order.userId);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Deliver order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyDeliveries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;

        const orders = await prisma.order.findMany({
            where: { driverId: userId },
            include: {
                store: true,
                deliveryAddress: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        console.error('Get my deliveries error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const uploadLicense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const licenseUrl = `/uploads/drivers/license-${userId}.jpg`;

        await (prisma.user as any).update({
            where: { id: userId },
            data: { licenseUrl }
        });

        res.json({ message: 'License uploaded successfully', licenseUrl });
    } catch (error) {
        console.error('Upload license error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const uploadInsurance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const insuranceUrl = `/uploads/drivers/insurance-${userId}.jpg`;

        await (prisma.user as any).update({
            where: { id: userId },
            data: { insuranceUrl }
        });

        res.json({ message: 'Insurance uploaded successfully', insuranceUrl });
    } catch (error) {
        console.error('Upload insurance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
