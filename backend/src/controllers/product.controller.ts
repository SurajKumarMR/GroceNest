
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { productSchema } from '../utils/validation';

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = productSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }

        const productData = validation.data;

        // Verify store ownership
        const store = await prisma.store.findUnique({ where: { id: productData.storeId } });
        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        if (store.ownerId !== userId) {
            res.status(403).json({ error: 'You are not the owner of this store' });
            return;
        }

        const product = await prisma.product.create({
            data: {
                ...productData,
            },
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { storeId, q, category, minPrice, maxPrice } = req.query;

        const whereClause: any = { status: 'active' };

        if (storeId) {
            whereClause.storeId = String(storeId);
        }

        if (q) {
            const searchTerms = String(q).split(' ').filter(term => term.length > 0);
            whereClause.AND = searchTerms.map(term => ({
                OR: [
                    { name: { contains: term, mode: 'insensitive' } },
                    { description: { contains: term, mode: 'insensitive' } },
                    { category: { name: { contains: term, mode: 'insensitive' } } }
                ]
            }));
        }

        if (category) {
            whereClause.categoryId = String(category);
        }

        if (minPrice || maxPrice) {
            whereClause.regularPrice = {};
            if (minPrice) whereClause.regularPrice.gte = Number(minPrice);
            if (maxPrice) whereClause.regularPrice.lte = Number(maxPrice);
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                store: {
                    select: {
                        name: true,
                    }
                }
            },
            take: 50,
        });
        res.json(products);
    } catch (error) {
        console.error('List products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
