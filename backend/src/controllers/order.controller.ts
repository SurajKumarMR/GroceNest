import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { createOrderSchema } from '../utils/validation';
import { OrderStatus, PaymentMethodType, Prisma } from '@prisma/client';
import { notificationService } from '../services/notification.service';
import { getIO } from '../services/socket.service';
import { calculateOrderPricing } from '../utils/pricing';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = createOrderSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }

        const { deliveryAddressId, deliveryInstructions, paymentMethod, tipAmount } = validation.data;

        // Get Cart
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                        productVariant: true,
                    }
                }
            }
        });

        if (!cart || cart.items.length === 0) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }

        // Verify address ownership
        const address = await prisma.address.findUnique({ where: { id: deliveryAddressId } });
        if (!address || address.userId !== userId) {
            res.status(400).json({ error: 'Invalid delivery address' });
            return;
        }

        // Group items by store to create separate orders if needed (marketplace model usually splits orders per store or creates one parent order)
        // For this implementation, we will assume single store order or split them.
        // Let's implement splitting by store for a true marketplace experience.

        const itemsByStore: Record<string, typeof cart.items> = {};
        cart.items.forEach(item => {
            if (!itemsByStore[item.storeId]) {
                itemsByStore[item.storeId] = [];
            }
            itemsByStore[item.storeId].push(item);
        });

        const createdOrders: any[] = [];
        const notificationData: { storeId: string; ownerId: string; orderNumber: string }[] = [];

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            for (const [storeId, items] of Object.entries(itemsByStore)) {
                // Verify and deduct stock atomically for tracked inventory items
                for (const item of items) {
                    if (item.product.trackInventory && !item.product.allowBackorder) {
                        const updated = await (tx.product as any).updateMany({
                            where: {
                                id: item.productId,
                                stockQuantity: { gte: item.quantity },
                            },
                            data: {
                                stockQuantity: { decrement: item.quantity },
                            },
                        });
                        if (updated.count === 0) {
                            throw new Error(`Insufficient stock for product '${item.product.name}'`);
                        }
                    }
                }

                const orderItemsData = items.map(item => {
                    const price = item.productVariant ? Number(item.productVariant.price) : Number(item.product.regularPrice);
                    const itemSubtotal = price * item.quantity;

                    return {
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        productName: item.product.name,
                        productVariantName: item.productVariant?.name,
                        unitPrice: price,
                        quantity: item.quantity,
                        subtotal: itemSubtotal,
                    };
                });

                const pricing = calculateOrderPricing(
                    orderItemsData.map(i => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
                    { tipAmount: tipAmount || 0 }
                );

                const { subtotal, deliveryFee, taxAmount, totalAmount } = pricing;

                const orderNumber = `GN${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

                const order = await (tx.order as any).create({
                    data: {
                        orderNumber,
                        deliveryOTP,
                        userId,
                        storeId,
                        deliveryAddressId,
                        deliveryInstructions,
                        subtotal,
                        deliveryFee,
                        taxAmount,
                        tipAmount: tipAmount || 0,
                        totalAmount,
                        paymentMethod: paymentMethod as PaymentMethodType,
                        status: OrderStatus.PENDING,
                        orderItems: {
                            create: orderItemsData
                        },
                        statusHistory: {
                            create: {
                                status: OrderStatus.PENDING,
                                note: 'Order placed',
                                createdBy: userId
                            }
                        }
                    } as any
                });
                createdOrders.push(order);

                // Fetch store owner for notification
                const store = await (tx.store as any).findUnique({
                    where: { id: storeId },
                    select: { ownerId: true }
                });

                if (store) {
                    notificationData.push({
                        storeId,
                        ownerId: store.ownerId,
                        orderNumber: order.orderNumber
                    });
                }
            }

            // Clear Cart
            await (tx.cartItem as any).deleteMany({ where: { cartId: cart.id } });
        }, { timeout: 15000 }); // Increased timeout to 15s

        // Send notifications outside transaction for better reliability and performance
        for (const notify of notificationData) {
            try {
                await notificationService.notifyNewOrder(notify.storeId, notify.ownerId, notify.orderNumber);
            } catch (err) {
                console.error('Failed to send notification for order:', notify.orderNumber, err);
                // Don't fail the whole request if notification fails
            }
        }

        // Notify stores in real-time via WebSockets
        const io = getIO();
        for (const order of createdOrders) {
            io.to(`store_${order.storeId}`).emit('NEW_ORDER', {
                orderId: order.id,
                total: order.totalAmount,
                createdAt: order.createdAt
            });
        }

        res.status(201).json({ message: 'Orders created successfully', orders: createdOrders });

    } catch (error: any) {
        if (error instanceof Error && error.message.includes('Insufficient stock')) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const autoCancelOrders = async (): Promise<void> => {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        const ordersToCancel = await prisma.order.findMany({
            where: {
                status: OrderStatus.PENDING,
                createdAt: { lt: tenMinutesAgo }
            }
        });

        for (const order of ordersToCancel) {
            await (prisma.order as any).update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.CANCELLED,
                    cancellationReason: 'Auto-cancelled: No response from store within 10 minutes',
                    cancelledAt: new Date(),
                    statusHistory: {
                        create: {
                            status: OrderStatus.CANCELLED,
                            note: 'Auto-cancelled: No response from store within 10 minutes',
                            createdBy: null
                        }
                    }
                }
            });
            console.log(`Auto-cancelled order: ${order.orderNumber}`);
        }
    } catch (error) {
        console.error('Auto-cancel orders error:', error);
    }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                store: { select: { name: true, logoUrl: true } },
                orderItems: true,
                reviews: true
            },
            orderBy: { placedAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params as { id: string };

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (order.userId !== userId) {
            res.status(403).json({ error: 'You do not have permission to cancel this order' });
            return;
        }

        const cancellableStatuses = ['PENDING', 'CONFIRMED'];
        if (!cancellableStatuses.includes(order.status)) {
            res.status(400).json({
                error: `Order cannot be cancelled — it is already ${order.status.toLowerCase().replace('_', ' ')}`
            });
            return;
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        res.json({ message: 'Order cancelled successfully', order: updated });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyOrderOTP = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params as { id: string };
        const { otp } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!otp) {
            res.status(400).json({ error: 'OTP is required' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { store: true }
        });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Only the assigned driver or the store owner can verify the OTP
        // Or if it's a customer verifying their own order (though usually driver does it)
        // For simplicity, let's allow the driver and store owner.
        const isDriver = order.driverId === userId;
        const isOwner = order.store?.ownerId === userId;
        
        // In a real app, we might check if the user is a DRIVER role.
        if (!isDriver && !isOwner && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'You do not have permission to verify this OTP' });
            return;
        }

        if (order.isOTPVerified) {
            res.status(400).json({ error: 'Order OTP already verified' });
            return;
        }

        if (order.deliveryOTP !== otp) {
            res.status(400).json({ error: 'Invalid OTP' });
            return;
        }

        const updated = await prisma.order.update({
            where: { id },
            data: {
                isOTPVerified: true,
                status: OrderStatus.DELIVERED,
                deliveredAt: new Date(),
                statusHistory: {
                    create: {
                        status: OrderStatus.DELIVERED,
                        note: 'OTP verified by driver. Order marked as delivered.',
                        createdBy: userId
                    }
                }
            }
        });

        res.json({ message: 'OTP verified and order delivered', order: updated });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
