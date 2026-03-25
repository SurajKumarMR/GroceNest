
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { orderId, storeId, productId, rating, reviewText, images } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Valid rating (1-5) is required' });
            return;
        }

        // Verify order exists and belongs to user if orderId is provided
        if (orderId) {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { userId: true, status: true }
            });

            if (!order || order.userId !== userId) {
                res.status(403).json({ error: 'Order not found or access denied' });
                return;
            }
        }

        const review = await prisma.$transaction(async (tx) => {
            const newReview = await tx.review.create({
                data: {
                    userId,
                    orderId,
                    storeId,
                    productId,
                    rating,
                    reviewText,
                    isVerified: !!orderId,
                    images: {
                        create: images?.map((url: string) => ({ url })) || []
                    }
                },
                include: { images: true }
            });

            // Update Store average rating if storeId is provided
            if (storeId) {
                const storeReviews = await tx.review.findMany({
                    where: { storeId },
                    select: { rating: true }
                });
                const avgRating = storeReviews.reduce((acc, curr) => acc + curr.rating, 0) / storeReviews.length;

                await tx.store.update({
                    where: { id: storeId },
                    data: {
                        averageRating: avgRating,
                        totalReviews: storeReviews.length
                    }
                });
            }

            // Update Product average rating if productId is provided
            if (productId) {
                const productReviews = await tx.review.findMany({
                    where: { productId },
                    select: { rating: true }
                });
                const avgRating = productReviews.reduce((acc, curr) => acc + curr.rating, 0) / productReviews.length;

                await tx.product.update({
                    where: { id: productId },
                    data: {
                        averageRating: avgRating,
                        totalReviews: productReviews.length
                    }
                });
            }

            return newReview;
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStoreReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { storeId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { storeId: storeId as string },
            include: {
                user: {
                    select: { firstName: true, lastName: true, profilePhotoUrl: true }
                },
                images: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(reviews);
    } catch (error) {
        console.error('Get store reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { productId: productId as string },
            include: {
                user: {
                    select: { firstName: true, lastName: true, profilePhotoUrl: true }
                },
                images: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(reviews);
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
