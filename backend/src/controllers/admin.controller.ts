
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';

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

export const getNotificationStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
        const { notificationService } = require('../services/notification.service');
        const stats = await notificationService.getDeliveryStats(isNaN(days) ? 7 : days);
        res.json(stats);
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNotificationLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { type, status, channel, limit } = req.query;
        const take = limit ? parseInt(limit as string, 10) : 50;

        const whereClause: any = {};
        if (type) whereClause.type = type as string;
        if (status) whereClause.status = status as string;
        if (channel) whereClause.channel = channel as string;

        const logs = await prisma.notificationLog.findMany({
            where: whereClause,
            orderBy: { sentAt: 'desc' },
            take: isNaN(take) ? 50 : take,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        res.json(logs);
    } catch (error) {
        console.error('Get notification logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const checkCustomerChurn = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const churnedCustomerIds = await analyticsService.detectAndTrackChurnedCustomers();
        res.json({
            message: 'Churn detection completed successfully',
            churnedCustomersCount: churnedCustomerIds.length,
            churnedCustomerIds
        });
    } catch (error) {
        console.error('Check customer churn error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAdminAnalyticsOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
        const timeframeDays = isNaN(days) ? 30 : days;
        const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            totalCustomers,
            newCustomers30Days,
            totalStores,
            activeStores,
            totalOrders,
            paidOrders,
            customerSignupsDaily,
            topStores
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startDate } } }),
            prisma.store.count(),
            prisma.store.count({ where: { orders: { some: { placedAt: { gte: startDate } } } } }),
            prisma.order.count(),
            prisma.order.findMany({
                where: {
                    placedAt: { gte: startDate },
                    paymentStatus: { in: ['paid', 'refunded'] }
                },
                select: {
                    id: true,
                    totalAmount: true,
                    placedAt: true,
                    paymentStatus: true,
                    status: true,
                    storeId: true
                }
            }),
            prisma.user.groupBy({
                by: ['createdAt'],
                where: {
                    role: 'CUSTOMER',
                    createdAt: { gte: startDate }
                },
                _count: { id: true }
            }),
            prisma.store.findMany({
                take: 10,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    cuisineTypes: true,
                    owner: { select: { email: true, firstName: true, lastName: true } },
                    orders: {
                        where: { status: 'DELIVERED' },
                        select: { totalAmount: true }
                    },
                    reviews: {
                        select: { rating: true }
                    }
                }
            })
        ]);

        const totalGrossRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const platformCommission = totalGrossRevenue * 0.10;
        const totalRefunds = paidOrders.filter(o => o.paymentStatus === 'refunded').reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const totalNetRevenue = Math.max(0, totalGrossRevenue - totalRefunds);

        const dailyMap = new Map<string, { orders: number; revenue: number; signups: number }>();
        for (const order of paidOrders) {
            const dateStr = order.placedAt.toISOString().split('T')[0];
            const curr = dailyMap.get(dateStr) || { orders: 0, revenue: 0, signups: 0 };
            dailyMap.set(dateStr, {
                orders: curr.orders + 1,
                revenue: curr.revenue + Number(order.totalAmount),
                signups: curr.signups
            });
        }

        for (const s of customerSignupsDaily) {
            const dateStr = s.createdAt.toISOString().split('T')[0];
            const curr = dailyMap.get(dateStr) || { orders: 0, revenue: 0, signups: 0 };
            dailyMap.set(dateStr, {
                orders: curr.orders,
                revenue: curr.revenue,
                signups: curr.signups + s._count.id
            });
        }

        const dailyStats = Array.from(dailyMap.entries()).map(([date, d]) => ({
            date,
            orders: d.orders,
            revenue: Number(d.revenue.toFixed(2)),
            customerSignups: d.signups
        })).sort((a, b) => a.date.localeCompare(b.date));

        const merchantPerformance = topStores.map(store => {
            const completedOrdersCount = store.orders.length;
            const totalStoreRevenue = store.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const totalRatings = store.reviews.length;
            const avgRating = totalRatings > 0
                ? Number((store.reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1))
                : 5.0;

            return {
                id: store.id,
                name: store.name,
                ownerName: store.owner ? `${store.owner.firstName} ${store.owner.lastName}` : 'N/A',
                ownerEmail: store.owner?.email || 'N/A',
                completedOrders: completedOrdersCount,
                totalRevenue: Number(totalStoreRevenue.toFixed(2)),
                rating: avgRating
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUserIds = await prisma.order.findMany({
            where: { placedAt: { gte: sevenDaysAgo } },
            select: { userId: true },
            distinct: ['userId']
        });
        const activeIds = activeUserIds.map(o => o.userId).filter(Boolean) as string[];
        const churnedCustomersCount = await prisma.user.count({
            where: {
                role: 'CUSTOMER',
                id: { notIn: activeIds }
            }
        });

        res.json({
            overview: {
                timeframeDays,
                totalOrders,
                ordersTimeframe: paidOrders.length,
                totalGrossRevenue: Number(totalGrossRevenue.toFixed(2)),
                totalNetRevenue: Number(totalNetRevenue.toFixed(2)),
                platformCommission: Number(platformCommission.toFixed(2)),
                totalUsers,
                totalCustomers,
                newCustomers30Days,
                churnedCustomersCount,
                totalStores,
                activeStores,
                dailyStats,
                merchantPerformance
            }
        });
    } catch (error) {
        console.error('Get admin analytics overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
