jest.mock('otplib', () => ({
    authenticator: {
        generateSecret: () => 'KVKFKRJTMR2HSKSK',
        check: () => true,
        keyuri: () => 'otpauth://totp/GroceNest:test@example.com?secret=KVKFKRJTMR2HSKSK&issuer=GroceNest'
    }
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock'
}));

import prisma from '../../utils/prisma';
import { Role } from '@prisma/client';
import { analyticsService } from '../../services/analytics.service';

describe('Merchant Event Tracking & Revenue Metrics Integration Tests', () => {
    let merchantUserId: string;
    let customerUserId: string;
    let storeId: string;
    let orderId: string;
    let orderNumber: string = `ORD-MERCHANT-${Date.now()}`;

    beforeAll(async () => {
        // Create Merchant User
        const merchant = await prisma.user.create({
            data: {
                email: `merchant-analytics-${Date.now()}@example.com`,
                firstName: 'Merchant',
                lastName: 'Owner',
                passwordHash: 'dummyhash',
                role: Role.MERCHANT
            }
        });
        merchantUserId = merchant.id;

        // Create Customer User
        const customer = await prisma.user.create({
            data: {
                email: `merchant-customer-${Date.now()}@example.com`,
                firstName: 'Buyer',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customerUserId = customer.id;

        // Create Store
        const store = await prisma.store.create({
            data: {
                name: 'Merchant Analytics Bakery',
                slug: `merchant-bakery-${Date.now()}`,
                streetAddress: '456 High St',
                city: 'Manchester',
                postalCode: 'M1 1AA',
                country: 'UK',
                latitude: 53.4808,
                longitude: -2.2426,
                cuisineTypes: ['bakery'],
                ownerId: merchantUserId
            }
        });
        storeId = store.id;

        // Track store creation
        await analyticsService.trackStoreCreated(merchantUserId, store.id, store.name);

        // Create paid order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: customerUserId,
                storeId: store.id,
                subtotal: 50.00,
                totalAmount: 50.00,
                status: 'CONFIRMED',
                paymentStatus: 'paid'
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        await prisma.order.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.analyticsEvent.deleteMany({ where: { userId: merchantUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: merchantUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: customerUserId } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should track STORE_CREATED event', async () => {
        await analyticsService.flush();

        const storeEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: merchantUserId, eventName: 'STORE_CREATED' }
        });

        expect(storeEvent).toBeDefined();
        expect(storeEvent?.eventName).toBe('STORE_CREATED');
        expect((storeEvent?.properties as any)?.storeName).toBe('Merchant Analytics Bakery');
    });

    it('should track MERCHANT_ORDER_ACCEPTED event', async () => {
        await analyticsService.trackOrderAccepted(storeId, merchantUserId, orderId, orderNumber, 50.00);
        await analyticsService.flush();

        const acceptEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: merchantUserId, eventName: 'MERCHANT_ORDER_ACCEPTED' }
        });

        expect(acceptEvent).toBeDefined();
        expect(acceptEvent?.eventName).toBe('MERCHANT_ORDER_ACCEPTED');
        expect((acceptEvent?.properties as any)?.amount).toBe(50.00);
    });

    it('should track MERCHANT_PAYOUT event', async () => {
        const payoutId = `pay-${Date.now()}`;
        await analyticsService.trackMerchantPayout(storeId, merchantUserId, 45.00, payoutId, 'completed');
        await analyticsService.flush();

        const payoutEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: merchantUserId, eventName: 'MERCHANT_PAYOUT' }
        });

        expect(payoutEvent).toBeDefined();
        expect(payoutEvent?.eventName).toBe('MERCHANT_PAYOUT');
        expect((payoutEvent?.properties as any)?.amount).toBe(45.00);
    });

    it('should compute merchant revenue metrics accurately', async () => {
        const metrics = await analyticsService.getMerchantRevenueMetrics(storeId, 30);

        expect(metrics).toBeDefined();
        expect(metrics.storeId).toBe(storeId);
        expect(metrics.totalGrossSales).toBe(50.00);
        expect(metrics.platformFee).toBe(5.00); // 10%
        expect(metrics.totalNetPayout).toBe(45.00); // 90%
        expect(metrics.totalOrderCount).toBe(1);
        expect(metrics.averageOrderValue).toBe(50.00);
        expect(metrics.dailySales.length).toBeGreaterThan(0);
    });
});
