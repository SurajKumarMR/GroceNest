
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { storeSchema } from '../utils/validation';
import { analyticsService } from '../services/analytics.service';

export const createStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = storeSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }

        const storeData = validation.data;

        // Check if slug exists
        const existingStore = await prisma.store.findUnique({ where: { slug: storeData.slug } });
        if (existingStore) {
            res.status(409).json({ error: 'Store with this slug already exists' });
            return;
        }

        const store = await prisma.store.create({
            data: {
                ...storeData,
                ownerId: userId,
                latitude: storeData.latitude,
                longitude: storeData.longitude,
            },
        });

        // Track store creation
        analyticsService.trackStoreCreated(userId, store.id, store.name);

        res.status(201).json(store);
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getStores = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, cuisine } = req.query;
        const whereClause: any = { isActive: true };

        if (q) {
            whereClause.OR = [
                { name: { contains: String(q), mode: 'insensitive' } },
                { description: { contains: String(q), mode: 'insensitive' } },
            ];
        }

        if (cuisine) {
            whereClause.cuisineTypes = { array_contains: String(cuisine) };
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [stores, total] = await Promise.all([
            prisma.store.findMany({
                where: whereClause,
                include: {
                    products: {
                        take: 3,
                    }
                },
                skip,
                take: limit,
            }),
            prisma.store.count({ where: whereClause })
        ]);

        res.json({
            stores,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('List stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStoreBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params as { slug: string };
        const store = await prisma.store.findUnique({
            where: { slug },
            include: {
                products: true,
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        res.json(store);
    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
export const updateStoreLogo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { storeId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const store = await prisma.store.findUnique({ where: { id: storeId as any } });
        if (!store || store.ownerId !== userId) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const logoUrl = `/uploads/stores/${req.file.filename}`;

        const updatedStore = await prisma.store.update({
            where: { id: storeId as string },
            data: { logoUrl }
        });

        res.json({ logoUrl: updatedStore.logoUrl });
    } catch (error) {
        console.error('Update store logo error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateStoreCover = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { storeId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const store = await prisma.store.findUnique({ where: { id: storeId as any } });
        if (!store || store.ownerId !== userId) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const coverPhotoUrl = `/uploads/stores/${req.file.filename}`;

        const updatedStore = await prisma.store.update({
            where: { id: storeId as string },
            data: { coverPhotoUrl }
        });

        res.json({ coverPhotoUrl: updatedStore.coverPhotoUrl });
    } catch (error) {
        console.error('Update store cover error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
