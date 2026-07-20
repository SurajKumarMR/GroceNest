import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import * as Sentry from '@sentry/node';

export const getBusinessMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        // 1. Authorization: Admin only
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied: Requires administrator privilege' });
            return;
        }

        // 2. Revenue & Order Volume
        const paidOrders = await prisma.order.findMany({
            where: { paymentStatus: 'paid' },
            select: { totalAmount: true }
        });
        const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const orderVolume = paidOrders.length;
        const averageOrderValue = orderVolume > 0 ? totalRevenue / orderVolume : 0;

        // 3. User & Store Registrations
        const totalUsers = await prisma.user.count();
        const totalDrivers = await prisma.user.count({ where: { role: 'DRIVER' } });
        const totalStores = await prisma.store.count();

        // 4. Returning Customer Rate / Retention
        const userOrderCounts = await prisma.order.groupBy({
            by: ['userId'],
            where: { paymentStatus: 'paid' },
            _count: { id: true }
        });
        const uniquePayingUsers = userOrderCounts.length;
        const multiOrderUsers = userOrderCounts.filter(u => u._count.id > 1).length;
        const customerRetentionRate = uniquePayingUsers > 0 ? (multiOrderUsers / uniquePayingUsers) * 100 : 0;

        // 5. Driver Efficiency (Average delivery duration in minutes)
        const deliveredOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                driverAssignedAt: { not: null },
                deliveredAt: { not: null }
            },
            select: {
                driverAssignedAt: true,
                deliveredAt: true
            }
        });
        
        let totalDeliveryTimeMs = 0;
        let validDeliveryCount = 0;
        deliveredOrders.forEach(order => {
            if (order.driverAssignedAt && order.deliveredAt) {
                totalDeliveryTimeMs += order.deliveredAt.getTime() - order.driverAssignedAt.getTime();
                validDeliveryCount++;
            }
        });
        const averageDeliveryTimeMinutes = validDeliveryCount > 0 
            ? (totalDeliveryTimeMs / validDeliveryCount) / 60000 
            : 0;

        // 6. Store Performance Ranking
        const storeOrders = await prisma.order.findMany({
            where: { paymentStatus: 'paid' },
            select: {
                storeId: true,
                totalAmount: true,
                store: { select: { name: true } }
            }
        });

        const storePerfMap: Record<string, { name: string, revenue: number, orderCount: number }> = {};
        storeOrders.forEach(order => {
            if (!order.storeId) return;
            if (!storePerfMap[order.storeId]) {
                storePerfMap[order.storeId] = { 
                    name: order.store?.name || 'Unknown Store', 
                    revenue: 0, 
                    orderCount: 0 
                };
            }
            storePerfMap[order.storeId].revenue += Number(order.totalAmount);
            storePerfMap[order.storeId].orderCount += 1;
        });
        const storePerformance = Object.values(storePerfMap).sort((a, b) => b.revenue - a.revenue);

        // 7. Recent Events Ingestion Feed
        const recentEvents = await prisma.analyticsEvent.findMany({
            take: 20,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });

        res.status(200).json({
            summary: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                orderVolume,
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                totalUsers,
                totalDrivers,
                totalStores,
                customerRetentionRate: parseFloat(customerRetentionRate.toFixed(1)),
                averageDeliveryTimeMinutes: parseFloat(averageDeliveryTimeMinutes.toFixed(1))
            },
            storePerformance,
            recentEvents
        });

    } catch (error) {
        console.error('Get business metrics error:', error);
        Sentry.captureException(error, { tags: { controller: 'analytics', method: 'getBusinessMetrics' } });
        res.status(500).json({ error: 'Internal server error' });
    }
};
