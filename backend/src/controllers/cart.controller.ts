
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { cartItemSchema } from '../utils/validation';
import { analyticsService } from '../services/analytics.service';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                        store: true,
                    }
                }
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                include: {
                    items: {
                        include: {
                            product: true,
                            store: true,
                        }
                    }
                }
            });
        }

        res.json(cart);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = cartItemSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }

        const { productId, productVariantId, quantity } = validation.data;

        // Fetch product to get storeId and check existence
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Stock validation
        if (product.trackInventory && !product.allowBackorder) {
            if (product.stockQuantity <= 0) {
                res.status(400).json({ error: `'${product.name}' is out of stock` });
                return;
            }
            if (quantity > product.stockQuantity) {
                res.status(400).json({ error: `Only ${product.stockQuantity} unit(s) of '${product.name}' available` });
                return;
            }
        }

        const cart = await prisma.cart.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });

        try {
            const item = await prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId,
                    productVariantId: productVariantId || null,
                },
            });

            if (item) {
                await prisma.cartItem.update({
                    where: { id: item.id },
                    data: { quantity: item.quantity + quantity },
                });
            } else {
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId,
                        productVariantId,
                        storeId: product.storeId,
                        quantity,
                    },
                });
            }
        } catch (err: any) {
            if (err.code === 'P2002') {
                const existing = await prisma.cartItem.findFirst({
                    where: {
                        cartId: cart.id,
                        productId,
                        productVariantId: productVariantId || null,
                    },
                });
                if (existing) {
                    await prisma.cartItem.update({
                        where: { id: existing.id },
                        data: { quantity: existing.quantity + quantity },
                    });
                }
            } else {
                throw err;
            }
        }

        // Return updated cart
        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: { items: { include: { product: true } } }
        });

        // Track cart addition
        analyticsService.trackCartAddition(userId, product.storeId, product.id, quantity, Number(product.regularPrice));

        res.json(updatedCart);

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params as { itemId: string };

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await prisma.cartItem.delete({
            where: { id: itemId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCartItemQuantity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params as { itemId: string };
        const { quantity } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            res.status(400).json({ error: 'Quantity must be a positive integer' });
            return;
        }

        const updatedItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity }
        });

        const updatedCart = await prisma.cart.findUnique({
            where: { id: updatedItem.cartId },
            include: { items: { include: { product: true } } }
        });

        res.json(updatedCart);
    } catch (error) {
        console.error('Update cart item quantity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
