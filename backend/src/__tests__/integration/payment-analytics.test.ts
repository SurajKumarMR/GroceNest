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

describe('Payment Event Tracking & Financial Revenue Analytics Integration Tests', () => {
    let customerUserId: string;
    let storeId: string;
    let orderId: string;

    beforeAll(async () => {
        // Create Customer User
        const customer = await prisma.user.create({
            data: {
                email: `payment-analytics-${Date.now()}@example.com`,
                firstName: 'Payment',
                lastName: 'Tester',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customerUserId = customer.id;

        // Create Store
        const store = await prisma.store.create({
            data: {
                name: 'Financial Analytics Store',
                slug: `financial-store-${Date.now()}`,
                streetAddress: '100 Finance St',
                city: 'London',
                postalCode: 'EC1A 1BB',
                country: 'UK',
                latitude: 51.5155,
                longitude: -0.0922,
                cuisineTypes: ['general'],
                ownerId: customerUserId
            }
        });
        storeId = store.id;

        // Create Paid Order
        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-PAY-${Date.now()}`,
                userId: customerUserId,
                storeId: store.id,
                subtotal: 100.00,
                totalAmount: 100.00,
                status: 'DELIVERED',
                paymentStatus: 'paid'
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        await prisma.order.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.analyticsEvent.deleteMany({ where: { userId: customerUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: customerUserId } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should track PAYMENT_COMPLETED event on payment success', async () => {
        await analyticsService.trackPaymentCompleted(customerUserId, orderId, 100.00, 'pi_mock_123');
        await analyticsService.flush();

        const successEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: customerUserId, eventName: 'PAYMENT_COMPLETED' }
        });

        expect(successEvent).toBeDefined();
        expect(successEvent?.eventName).toBe('PAYMENT_COMPLETED');
        expect((successEvent?.properties as any)?.transactionId).toBe('pi_mock_123');
    });

    it('should track PAYMENT_FAILED event on payment failure', async () => {
        await analyticsService.trackPaymentFailed(customerUserId, orderId, 100.00, 'Card declined');
        await analyticsService.flush();

        const failureEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: customerUserId, eventName: 'PAYMENT_FAILED' }
        });

        expect(failureEvent).toBeDefined();
        expect(failureEvent?.eventName).toBe('PAYMENT_FAILED');
        expect((failureEvent?.properties as any)?.errorMsg).toBe('Card declined');
    });

    it('should track PAYMENT_REFUNDED event on refund execution', async () => {
        await analyticsService.trackPaymentRefunded(customerUserId, orderId, 20.00, 'Partial refund for item out of stock');
        await analyticsService.flush();

        const refundEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: customerUserId, eventName: 'PAYMENT_REFUNDED' }
        });

        expect(refundEvent).toBeDefined();
        expect(refundEvent?.eventName).toBe('PAYMENT_REFUNDED');
        expect((refundEvent?.properties as any)?.refundAmount).toBe(20.00);
    });

    it('should compute platform-wide financial revenue metrics accurately', async () => {
        const metrics = await analyticsService.getFinancialAnalyticsMetrics(30);

        expect(metrics).toBeDefined();
        expect(metrics.totalGrossRevenue).toBeGreaterThanOrEqual(100.00);
        expect(metrics.totalRefunds).toBeGreaterThanOrEqual(20.00);
        expect(metrics.totalNetRevenue).toBe(metrics.totalGrossRevenue - metrics.totalRefunds);
        expect(metrics.platformCommissionEarned).toBe(Number((metrics.totalGrossRevenue * 0.10).toFixed(2)));
        expect(metrics.paymentSuccessRate).toBeGreaterThan(0);
        expect(metrics.dailyFinancials.length).toBeGreaterThan(0);
    });
});
