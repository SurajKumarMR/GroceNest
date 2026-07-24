import prisma from '../utils/prisma';
import logger from '../utils/logger';
import * as Sentry from '@sentry/node';
import axios from 'axios';

export interface AnalyticsEventData {
    eventName: string;
    userId?: string | null;
    properties?: any;
    timestamp: Date;
}

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 1000;

let eventQueue: AnalyticsEventData[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let isFlushing = false;

const startFlushTimer = () => {
    if (!flushTimer) {
        flushTimer = setInterval(() => {
            analyticsService.flush().catch((err) => {
                logger.error('Background analytics flush error:', err);
            });
        }, FLUSH_INTERVAL_MS);
        if (flushTimer.unref) {
            flushTimer.unref();
        }
    }
};

const sendToMixpanel = async (events: AnalyticsEventData[]) => {
    const token = process.env.MIXPANEL_TOKEN;
    if (!token) return;

    try {
        const payload = events.map((e) => ({
            event: e.eventName,
            properties: {
                token,
                distinct_id: e.userId || 'anonymous',
                time: Math.floor(e.timestamp.getTime() / 1000),
                ...(e.properties || {}),
            },
        }));

        await axios.post('https://api.mixpanel.com/track', payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
        });
        logger.info(`[ANALYTICS] Sent ${events.length} events to Mixpanel`);
    } catch (error) {
        logger.error('[ANALYTICS] Mixpanel dispatch failed:', error);
    }
};

const sendToAmplitude = async (events: AnalyticsEventData[]) => {
    const apiKey = process.env.AMPLITUDE_API_KEY;
    if (!apiKey) return;

    try {
        const payload = {
            api_key: apiKey,
            events: events.map((e) => ({
                event_type: e.eventName,
                user_id: e.userId || 'anonymous',
                event_properties: e.properties || {},
                time: e.timestamp.getTime(),
            })),
        };

        await axios.post('https://api2.amplitude.com/2/httpapi', payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
        });
        logger.info(`[ANALYTICS] Sent ${events.length} events to Amplitude`);
    } catch (error) {
        logger.error('[ANALYTICS] Amplitude dispatch failed:', error);
    }
};

export const analyticsService = {
    /**
     * Non-blocking event tracking.
     * Enqueues the event and triggers background batch processing.
     */
    trackEvent: async (eventName: string, userId?: string, properties?: any) => {
        try {
            const event: AnalyticsEventData = {
                eventName,
                userId: userId || null,
                properties: properties || {},
                timestamp: new Date(),
            };

            // Log for structured server ingestion
            logger.info(`[ANALYTICS EVENT] ${eventName} | User: ${userId || 'Guest'} | Properties: ${JSON.stringify(properties || {})}`);

            // Enqueue event (respecting queue limit)
            if (eventQueue.length < MAX_QUEUE_SIZE) {
                eventQueue.push(event);
            } else {
                logger.warn('[ANALYTICS] Queue capacity reached. Dropping oldest event.');
                eventQueue.shift();
                eventQueue.push(event);
            }

            startFlushTimer();

            // Trigger immediate non-blocking flush if batch size threshold is reached
            if (eventQueue.length >= BATCH_SIZE && !isFlushing) {
                setImmediate(() => {
                    analyticsService.flush().catch((err) => {
                        logger.error('Analytics batch flush error:', err);
                    });
                });
            }
        } catch (error) {
            console.error(`Failed to enqueue event ${eventName}:`, error);
            Sentry.captureException(error, { tags: { service: 'analytics', eventName } });
        }
    },

    /**
     * Flushes buffered events to database, Mixpanel, and Amplitude.
     */
    flush: async () => {
        if (isFlushing || eventQueue.length === 0) return;
        isFlushing = true;

        const batch = eventQueue.splice(0, BATCH_SIZE);
        let dbSuccess = false;

        try {
            // 1. Batch insert into PostgreSQL
            try {
                await prisma.analyticsEvent.createMany({
                    data: batch.map((e) => ({
                        eventName: e.eventName,
                        userId: e.userId || null,
                        properties: e.properties || {},
                        timestamp: e.timestamp,
                    })),
                });
                dbSuccess = true;
            } catch (dbError) {
                logger.error('[ANALYTICS] Database batch insert failed:', dbError);
                Sentry.captureException(dbError, { tags: { service: 'analytics', phase: 'db_flush' } });
            }

            // 2. Dispatch to Mixpanel & Amplitude in parallel
            await Promise.allSettled([sendToMixpanel(batch), sendToAmplitude(batch)]);

            // If DB insert failed, re-enqueue batch for retry on next flush
            if (!dbSuccess) {
                if (eventQueue.length + batch.length <= MAX_QUEUE_SIZE) {
                    eventQueue.unshift(...batch);
                }
            }
        } catch (error) {
            logger.error('[ANALYTICS] General flush failure, re-queueing batch:', error);
            Sentry.captureException(error, { tags: { service: 'analytics', phase: 'flush' } });
            if (eventQueue.length + batch.length <= MAX_QUEUE_SIZE) {
                eventQueue.unshift(...batch);
            }
        } finally {
            isFlushing = false;
        }
    },

    /**
     * Returns current queue size (useful for testing/diagnostics).
     */
    getQueueSize: () => eventQueue.length,

    /**
     * Clears queue and timer (useful for test setup/teardown).
     */
    clearQueue: () => {
        eventQueue = [];
        if (flushTimer) {
            clearInterval(flushTimer);
            flushTimer = null;
        }
        isFlushing = false;
    },

    // 4.2 Customer Event Tracking
    trackSignup: async (userId: string, role: string, source?: string) => {
        await analyticsService.trackEvent('CUSTOMER_SIGNUP', userId, { role, source });
    },

    trackLogin: async (userId: string, role: string) => {
        await analyticsService.trackEvent('CUSTOMER_LOGIN', userId, { role });
    },

    trackCartAddition: async (userId: string, storeId: string, productId: string, quantity: number, price: number) => {
        await analyticsService.trackEvent('CART_ADDITION', userId, { storeId, productId, quantity, price });
    },

    trackFirstOrder: async (userId: string, orderId: string, amount: number) => {
        await analyticsService.trackEvent('CUSTOMER_FIRST_ORDER', userId, { orderId, amount });
    },

    trackRepeatOrder: async (userId: string, orderId: string, amount: number, orderCount: number) => {
        await analyticsService.trackEvent('CUSTOMER_REPEAT_ORDER', userId, { orderId, amount, orderCount });
    },

    trackOrderPlaced: async (userId: string, orderId: string, amount: number) => {
        try {
            const priorOrderCount = await prisma.order.count({
                where: {
                    userId,
                    id: { not: orderId }
                }
            });

            if (priorOrderCount === 0) {
                await analyticsService.trackFirstOrder(userId, orderId, amount);
            } else {
                await analyticsService.trackRepeatOrder(userId, orderId, amount, priorOrderCount + 1);
            }
        } catch (error) {
            logger.error('Error tracking order placement lifecycle event:', error);
            await analyticsService.trackEvent('ORDER_PLACED', userId, { orderId, amount });
        }
    },

    /**
     * Audit customers with no orders in past 7 days and emit CUSTOMER_CHURNED event
     */
    detectAndTrackChurnedCustomers: async (): Promise<string[]> => {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const candidateCustomers = await prisma.user.findMany({
                where: {
                    role: 'CUSTOMER',
                    createdAt: { lte: sevenDaysAgo },
                    orders: {
                        none: {
                            placedAt: { gte: sevenDaysAgo }
                        }
                    }
                },
                include: {
                    orders: {
                        orderBy: { placedAt: 'desc' },
                        take: 1
                    }
                }
            });

            const churnedCustomerIds: string[] = [];

            for (const customer of candidateCustomers) {
                const recentChurnEvent = await prisma.analyticsEvent.findFirst({
                    where: {
                        userId: customer.id,
                        eventName: 'CUSTOMER_CHURNED',
                        timestamp: { gte: sevenDaysAgo }
                    }
                });

                if (!recentChurnEvent) {
                    const lastOrder = customer.orders[0];
                    const lastOrderDate = lastOrder ? lastOrder.placedAt : customer.createdAt;
                    const daysInactive = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

                    await analyticsService.trackEvent('CUSTOMER_CHURNED', customer.id, {
                        daysInactive,
                        lastOrderDate,
                        totalOrdersPlaced: customer.orders.length
                    });
                    churnedCustomerIds.push(customer.id);
                }
            }

            logger.info(`[ANALYTICS] Churn detection completed. Tracked ${churnedCustomerIds.length} churned customers.`);
            return churnedCustomerIds;
        } catch (error) {
            logger.error('Error detecting customer churn:', error);
            return [];
        }
    },

    // 4.3 Merchant Event Tracking
    trackStoreCreated: async (userId: string, storeId: string, storeName: string) => {
        await analyticsService.trackEvent('STORE_CREATED', userId, { storeId, storeName });
    },

    trackOrderAccepted: async (storeId: string, ownerId: string, orderId: string, orderNumber: string, amount: number) => {
        await analyticsService.trackEvent('MERCHANT_ORDER_ACCEPTED', ownerId, { storeId, orderId, orderNumber, amount });
    },

    trackMerchantPayout: async (storeId: string, ownerId: string, amount: number, payoutId?: string, status: string = 'completed') => {
        await analyticsService.trackEvent('MERCHANT_PAYOUT', ownerId, { storeId, amount, payoutId, status });
    },

    trackProductUpdated: async (userId: string, storeId: string, productId: string, name: string) => {
        await analyticsService.trackEvent('PRODUCT_UPDATED', userId, { storeId, productId, name });
    },

    /**
     * Compute aggregated revenue, payouts, and daily sales metrics for a merchant store
     */
    getMerchantRevenueMetrics: async (storeId: string, timeframeDays: number = 30) => {
        try {
            const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

            const orders = await prisma.order.findMany({
                where: {
                    storeId,
                    placedAt: { gte: startDate },
                    paymentStatus: 'paid'
                },
                select: {
                    id: true,
                    totalAmount: true,
                    placedAt: true
                }
            });

            const totalOrderCount = orders.length;
            const totalGrossSales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const platformFee = totalGrossSales * 0.10; // 10% platform commission
            const totalNetPayout = totalGrossSales - platformFee;
            const averageOrderValue = totalOrderCount > 0 ? totalGrossSales / totalOrderCount : 0;

            const dailyMap = new Map<string, { grossSales: number; orderCount: number }>();
            for (const order of orders) {
                const dateStr = order.placedAt.toISOString().split('T')[0];
                const curr = dailyMap.get(dateStr) || { grossSales: 0, orderCount: 0 };
                dailyMap.set(dateStr, {
                    grossSales: curr.grossSales + Number(order.totalAmount),
                    orderCount: curr.orderCount + 1
                });
            }

            const dailySales = Array.from(dailyMap.entries()).map(([date, data]) => ({
                date,
                grossSales: Number(data.grossSales.toFixed(2)),
                orderCount: data.orderCount
            })).sort((a, b) => a.date.localeCompare(b.date));

            return {
                storeId,
                timeframeDays,
                totalGrossSales: Number(totalGrossSales.toFixed(2)),
                platformFee: Number(platformFee.toFixed(2)),
                totalNetPayout: Number(totalNetPayout.toFixed(2)),
                totalOrderCount,
                averageOrderValue: Number(averageOrderValue.toFixed(2)),
                dailySales
            };
        } catch (error) {
            logger.error('Error calculating merchant revenue metrics:', error);
            throw error;
        }
    },

    // 4.4 Driver Event Tracking
    trackDriverLocationUpdate: async (driverId: string, latitude: number, longitude: number, accuracy?: number) => {
        logger.info(`[ANALYTICS EVENT] DRIVER_LOCATION_UPDATE | Driver: ${driverId} | Lat: ${latitude}, Lng: ${longitude}`);
        await analyticsService.trackEvent('DRIVER_LOCATION_UPDATE', driverId, { latitude, longitude, accuracy });
    },

    // 4.5 Payment Event Tracking
    trackCheckoutStarted: async (userId: string, orderId: string, amount: number) => {
        await analyticsService.trackEvent('CHECKOUT_STARTED', userId, { orderId, amount });
    },

    trackPaymentCompleted: async (userId: string, orderId: string, amount: number, transactionId: string) => {
        await analyticsService.trackEvent('PAYMENT_COMPLETED', userId, { orderId, amount, transactionId });
    },

    trackPaymentFailed: async (userId: string, orderId: string, amount: number, errorMsg: string) => {
        await analyticsService.trackEvent('PAYMENT_FAILED', userId, { orderId, amount, errorMsg });
    },
};
