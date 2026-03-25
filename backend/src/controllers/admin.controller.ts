
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [userCount, storeCount, orderCount, revenue] = await Promise.all([
            prisma.user.count(),
            prisma.store.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: {
                    totalAmount: true
                },
                where: {
                    status: 'DELIVERED'
                }
            })
        ]);

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const [newOrdersLast30Days, dailyStats] = await Promise.all([
            prisma.order.count({
                where: {
                    placedAt: {
                        gte: last30Days
                    }
                }
            }),
            prisma.order.groupBy({
                by: ['placedAt'],
                where: {
                    placedAt: {
                        gte: last30Days
                    },
                    status: 'DELIVERED'
                },
                _sum: {
                    totalAmount: true
                },
                _count: {
                    id: true
                }
            })
        ]);

        // Process daily stats into a more chart-friendly format
        // Note: groupby with Date might need post-processing to group by YYYY-MM-DD
        const formattedDailyStats = dailyStats.reduce((acc: any, curr: any) => {
            const date = curr.placedAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, orders: 0, revenue: 0 };
            }
            acc[date].orders += curr._count.id;
            acc[date].revenue += Number(curr._sum.totalAmount || 0);
            return acc;
        }, {});

        const chartData = Object.values(formattedDailyStats).sort((a: any, b: any) =>
            a.date.localeCompare(b.date)
        );

        res.json({
            stats: {
                totalUsers: userCount,
                totalStores: storeCount,
                totalOrders: orderCount,
                totalRevenue: Number(revenue._sum.totalAmount || 0),
                newOrdersLast30Days,
                chartData
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                // Assuming an 'isActive' field might exist or we just show role management
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllStores = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stores = await prisma.store.findMany({
            include: {
                owner: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(stores);
    } catch (error) {
        console.error('Get all stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            res.status(400).json({ error: 'isActive boolean is required' });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId as string },
            data: { isActive },
            select: {
                id: true,
                email: true,
                isActive: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const toggleStoreStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            res.status(400).json({ error: 'isActive boolean is required' });
            return;
        }

        const updatedStore = await prisma.store.update({
            where: { id: storeId as string },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true
            }
        });

        res.json(updatedStore);
    } catch (error) {
        console.error('Toggle store status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
