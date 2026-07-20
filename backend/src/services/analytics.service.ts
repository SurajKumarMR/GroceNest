import prisma from '../utils/prisma';
import logger from '../utils/logger';
import * as Sentry from '@sentry/node';

export const analyticsService = {
    /**
     * Core event tracking function.
     * Inserts into DB and logs to Winston.
     */
    trackEvent: async (eventName: string, userId?: string, properties?: any) => {
        try {
            // Log for structured ingestion
            logger.info(`[ANALYTICS EVENT] ${eventName} | User: ${userId || 'Guest'} | Properties: ${JSON.stringify(properties || {})}`);

            // Save to PostgreSQL DB
            await prisma.analyticsEvent.create({
                data: {
                    eventName,
                    userId: userId || null,
                    properties: properties || {}
                }
            });
        } catch (error) {
            console.error(`Failed to track event ${eventName}:`, error);
            Sentry.captureException(error, { tags: { service: 'analytics', eventName } });
        }
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

    // 4.3 Merchant Event Tracking
    trackStoreCreated: async (userId: string, storeId: string, storeName: string) => {
        await analyticsService.trackEvent('STORE_CREATED', userId, { storeId, storeName });
    },

    trackProductUpdated: async (userId: string, storeId: string, productId: string, name: string) => {
        await analyticsService.trackEvent('PRODUCT_UPDATED', userId, { storeId, productId, name });
    },

    // 4.4 Driver Event Tracking
    trackDriverLocationUpdate: async (driverId: string, latitude: number, longitude: number, accuracy?: number) => {
        // Location updates can be high frequency, so we log them but only save to DB if needed
        logger.info(`[ANALYTICS EVENT] DRIVER_LOCATION_UPDATE | Driver: ${driverId} | Lat: ${latitude}, Lng: ${longitude}`);
        // We can optionally write to DB, let's keep database writes for high value events or log them
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
    }
};
