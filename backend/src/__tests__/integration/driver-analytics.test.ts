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

describe('Driver Performance & Event Tracking Integration Tests', () => {
    let driverUserId: string;
    let customerUserId: string;
    let storeId: string;
    let orderId: string;
    let orderNumber: string = `ORD-DRIVER-${Date.now()}`;

    beforeAll(async () => {
        // Create Driver User
        const driver = await prisma.user.create({
            data: {
                email: `driver-analytics-${Date.now()}@example.com`,
                firstName: 'Speedy',
                lastName: 'Driver',
                passwordHash: 'dummyhash',
                role: Role.DRIVER,
                isDriverApproved: true
            }
        });
        driverUserId = driver.id;

        // Create Customer User
        const customer = await prisma.user.create({
            data: {
                email: `driver-customer-${Date.now()}@example.com`,
                firstName: 'Order',
                lastName: 'Receiver',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customerUserId = customer.id;

        // Create Store
        const store = await prisma.store.create({
            data: {
                name: 'Driver Analytics Store',
                slug: `driver-store-${Date.now()}`,
                streetAddress: '789 Driver Way',
                city: 'Birmingham',
                postalCode: 'B1 1AA',
                country: 'UK',
                latitude: 52.4862,
                longitude: -1.8904,
                cuisineTypes: ['fast_delivery'],
                ownerId: driverUserId
            }
        });
        storeId = store.id;

        // Create Order assigned to driver
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: customerUserId,
                storeId: store.id,
                driverId: driverUserId,
                subtotal: 20.00,
                deliveryFee: 4.50,
                tipAmount: 2.50,
                totalAmount: 27.00,
                status: 'DELIVERED',
                paymentStatus: 'paid',
                deliveredAt: new Date()
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        await prisma.order.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.analyticsEvent.deleteMany({ where: { userId: driverUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: driverUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: customerUserId } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should track DRIVER_SHIFT_STARTED and DRIVER_SHIFT_ENDED events', async () => {
        await analyticsService.trackDriverShiftStart(driverUserId);
        await analyticsService.trackDriverShiftEnd(driverUserId, 120);
        await analyticsService.flush();

        const startEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: driverUserId, eventName: 'DRIVER_SHIFT_STARTED' }
        });
        const endEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: driverUserId, eventName: 'DRIVER_SHIFT_ENDED' }
        });

        expect(startEvent).toBeDefined();
        expect(endEvent).toBeDefined();
        expect((endEvent?.properties as any)?.durationMinutes).toBe(120);
    });

    it('should track DRIVER_DELIVERY_COMPLETED event with fee & tip earnings', async () => {
        await analyticsService.trackDriverDeliveryCompleted(driverUserId, orderId, 4.50, 2.50);
        await analyticsService.flush();

        const deliveryEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: driverUserId, eventName: 'DRIVER_DELIVERY_COMPLETED' }
        });

        expect(deliveryEvent).toBeDefined();
        expect((deliveryEvent?.properties as any)?.deliveryFee).toBe(4.50);
        expect((deliveryEvent?.properties as any)?.tipAmount).toBe(2.50);
        expect((deliveryEvent?.properties as any)?.totalEarned).toBe(7.00);
    });

    it('should track DRIVER_RATED event', async () => {
        await analyticsService.trackDriverRating(driverUserId, orderId, 5, 'Great fast service!');
        await analyticsService.flush();

        const ratingEvent = await prisma.analyticsEvent.findFirst({
            where: { userId: driverUserId, eventName: 'DRIVER_RATED' }
        });

        expect(ratingEvent).toBeDefined();
        expect((ratingEvent?.properties as any)?.rating).toBe(5);
        expect((ratingEvent?.properties as any)?.feedback).toBe('Great fast service!');
    });

    it('should compute driver performance & earnings metrics accurately', async () => {
        const metrics = await analyticsService.getDriverPerformanceMetrics(driverUserId, 30);

        expect(metrics).toBeDefined();
        expect(metrics.driverId).toBe(driverUserId);
        expect(metrics.totalCompletedDeliveries).toBe(1);
        expect(metrics.totalDeliveryFees).toBe(4.50);
        expect(metrics.totalTips).toBe(2.50);
        expect(metrics.totalEarnings).toBe(7.00);
        expect(metrics.averageRating).toBe(5);
        expect(metrics.completedShiftsCount).toBeGreaterThanOrEqual(1);
        expect(metrics.dailyBreakdown.length).toBeGreaterThan(0);
    });
});
