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

describe('Customer Lifecycle Event Tracking Integration Tests', () => {
    let userId: string;
    let storeId: string;
    let productId: string;

    beforeAll(async () => {
        // Create user
        const user = await prisma.user.create({
            data: {
                email: `customer-analytics-${Date.now()}@example.com`,
                firstName: 'Lifecycle',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        userId = user.id;

        // Create store
        const store = await prisma.store.create({
            data: {
                name: 'Customer Analytics Store',
                slug: `analytics-store-${Date.now()}`,
                streetAddress: '123 Test St',
                city: 'London',
                postalCode: 'SW1A 1AA',
                country: 'UK',
                latitude: 51.5074,
                longitude: -0.1278,
                cuisineTypes: ['groceries'],
                ownerId: userId
            }
        });
        storeId = store.id;

        // Create product
        const product = await prisma.product.create({
            data: {
                name: 'Fresh Milk',
                slug: `fresh-milk-${Date.now()}`,
                regularPrice: 2.50,
                stockQuantity: 50,
                unit: 'L',
                storeId: store.id
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        await prisma.orderItem.deleteMany({ where: { order: { storeId } } }).catch(() => {});
        await prisma.order.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.analyticsEvent.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should track CUSTOMER_SIGNUP event', async () => {
        await analyticsService.trackSignup(userId, 'CUSTOMER', 'email_signup');
        await analyticsService.flush();

        const signupEvent = await prisma.analyticsEvent.findFirst({
            where: { userId, eventName: 'CUSTOMER_SIGNUP' }
        });

        expect(signupEvent).toBeDefined();
        expect(signupEvent?.eventName).toBe('CUSTOMER_SIGNUP');
    });

    it('should track CUSTOMER_FIRST_ORDER when customer places 1st order', async () => {
        const order1Number = `ORD-FIRST-${Date.now()}`;
        const order1 = await prisma.order.create({
            data: {
                orderNumber: order1Number,
                userId,
                storeId,
                subtotal: 10.00,
                totalAmount: 10.00,
                status: 'PENDING'
            }
        });

        await analyticsService.trackOrderPlaced(userId, order1.id, 10.00);
        await analyticsService.flush();

        const firstOrderEvent = await prisma.analyticsEvent.findFirst({
            where: { userId, eventName: 'CUSTOMER_FIRST_ORDER' }
        });

        expect(firstOrderEvent).toBeDefined();
        expect(firstOrderEvent?.eventName).toBe('CUSTOMER_FIRST_ORDER');
    });

    it('should track CUSTOMER_REPEAT_ORDER when customer places 2nd order', async () => {
        const order2Number = `ORD-REPEAT-${Date.now()}`;
        const order2 = await prisma.order.create({
            data: {
                orderNumber: order2Number,
                userId,
                storeId,
                subtotal: 15.00,
                totalAmount: 15.00,
                status: 'PENDING'
            }
        });

        await analyticsService.trackOrderPlaced(userId, order2.id, 15.00);
        await analyticsService.flush();

        const repeatOrderEvent = await prisma.analyticsEvent.findFirst({
            where: { userId, eventName: 'CUSTOMER_REPEAT_ORDER' }
        });

        expect(repeatOrderEvent).toBeDefined();
        expect(repeatOrderEvent?.eventName).toBe('CUSTOMER_REPEAT_ORDER');
        expect((repeatOrderEvent?.properties as any)?.orderCount).toBe(2);
    });

    it('should track CUSTOMER_CHURNED for customer inactive for 7+ days', async () => {
        // Create an inactive user created 10 days ago with no recent orders
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        const inactiveUser = await prisma.user.create({
            data: {
                email: `inactive-customer-${Date.now()}@example.com`,
                firstName: 'Inactive',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER,
                createdAt: tenDaysAgo
            }
        });

        const churnedIds = await analyticsService.detectAndTrackChurnedCustomers();
        await analyticsService.flush();

        expect(churnedIds).toContain(inactiveUser.id);

        const churnEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: inactiveUser.id, eventName: 'CUSTOMER_CHURNED' }
        });

        expect(churnEvent).toBeDefined();
        expect(churnEvent?.eventName).toBe('CUSTOMER_CHURNED');

        // Cleanup inactive user
        await prisma.analyticsEvent.deleteMany({ where: { userId: inactiveUser.id } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: inactiveUser.id } }).catch(() => {});
    });
});
