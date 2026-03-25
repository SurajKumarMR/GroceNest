
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { OrderStatus } from '@prisma/client';
import { notificationService } from '../services/notification.service';

export const getMyStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const store = await prisma.store.findFirst({
            where: { ownerId: userId },
            include: {
                _count: {
                    select: { products: true, orders: true }
                }
            }
        });

        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        res.json(store);
    } catch (error) {
        console.error('Get my store error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStoreOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const store = await prisma.store.findFirst({ where: { ownerId: userId } });
        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        const orders = await prisma.order.findMany({
            where: { storeId: store.id },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                },
                orderItems: true,
                deliveryAddress: true
            },
            orderBy: { placedAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        console.error('Get store orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const orderId = req.params.orderId as string;
        const { status, note } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { store: true }
        }) as any;

        if (!order || !order.store) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (order.store.ownerId !== userId) {
            res.status(403).json({ error: 'Not authorized to update this order' });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: status as OrderStatus,
                statusHistory: {
                    create: {
                        status: status as OrderStatus,
                        note: note || `Status updated to ${status}`,
                        createdBy: userId
                    }
                }
            } as any
        });

        // Notify customer
        if (order.userId) {
            await notificationService.notifyOrderStatusChange(orderId, status, order.userId);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const { name, description, cuisineTypes, specialtyTags, phone, email, streetAddress, city, state, postalCode, country } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const store = await prisma.store.findFirst({
            where: { ownerId: userId }
        });

        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        const updatedStore = await prisma.store.update({
            where: { id: store.id },
            data: {
                name,
                description,
                cuisineTypes,
                specialtyTags,
                phone,
                email,
                streetAddress,
                city,
                state,
                postalCode,
                country
            }
        });

        res.json(updatedStore);
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const { name, description, regularPrice, categoryId, status, stockQuantity } = req.body;

        const store = await prisma.store.findFirst({ where: { ownerId: userId } });
        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name,
                slug: name.toLowerCase().replace(/ /g, '-'),
                description,
                regularPrice,
                categoryId,
                status: status || 'active',
                stockQuantity: stockQuantity || 0
            }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const productId = req.params.productId as string;

        const store = await prisma.store.findFirst({ where: { ownerId: userId } });
        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product || product.storeId !== store.id) {
            res.status(404).json({ error: 'Product not found or not authorized' });
            return;
        }

        await prisma.product.delete({ where: { id: productId } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const productId = req.params.productId as string;
        const { name, description, regularPrice, categoryId, status, stockQuantity } = req.body;

        const store = await prisma.store.findFirst({ where: { ownerId: userId } });
        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product || product.storeId !== store.id) {
            res.status(404).json({ error: 'Product not found or not authorized' });
            return;
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                description,
                regularPrice,
                categoryId,
                status,
                stockQuantity
            }
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const uploadProductImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;
        const productId = req.params.productId as string;

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const store = await prisma.store.findFirst({ where: { ownerId: userId } });
        if (!store) {
            res.status(401).json({ error: 'Store not found' });
            return;
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || product.storeId !== store.id) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        const imageUrl = `/uploads/products/${req.file.filename}`;

        const productImage = await prisma.productImage.create({
            data: {
                productId,
                url: imageUrl,
                displayOrder: 0
            }
        });

        res.status(201).json(productImage);
    } catch (error) {
        console.error('Upload product image error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
