jest.mock('otplib', () => ({
    generateSecret: () => 'KVKFKRJTMR2HSKSK',
    verify: async () => true,
    generateURI: () => 'otpauth://totp/GroceNest:test@example.com?secret=KVKFKRJTMR2HSKSK&issuer=GroceNest'
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock'
}));

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { Role, OrderStatus } from '@prisma/client';
import { signToken } from '../../utils/jwt.utils';

describe('Driver Controller Integration Tests', () => {
    let customerId: string;
    let storeId: string;
    let driverId: string;
    let unapprovedDriverId: string;
    
    let driverToken: string;
    let unapprovedDriverToken: string;

    let readyOrderId: string;
    let pendingOrderId: string;

    beforeAll(async () => {
        // Create customer
        const customer = await prisma.user.create({
            data: {
                email: `driver-cust-${Date.now()}@example.com`,
                firstName: 'Driver',
                lastName: 'Cust',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customerId = customer.id;

        // Create store owner
        const owner = await prisma.user.create({
            data: {
                email: `driver-owner-${Date.now()}@example.com`,
                firstName: 'Driver',
                lastName: 'Owner',
                passwordHash: 'dummyhash',
                role: Role.MERCHANT
            }
        });

        // Create store
        const store = await prisma.store.create({
            data: {
                name: 'Driver Store',
                slug: `driver-store-${Date.now()}`,
                ownerId: owner.id,
                cuisineTypes: ['Fast Food'],
                streetAddress: '456 Driver St',
                city: 'Leeds',
                postalCode: 'LS1 1AA',
                country: 'UK',
                latitude: 53.8008,
                longitude: -1.5491
            }
        });
        storeId = store.id;

        // Create approved driver
        const driver = await prisma.user.create({
            data: {
                email: `driver-app-${Date.now()}@example.com`,
                firstName: 'Approved',
                lastName: 'Driver',
                passwordHash: 'dummyhash',
                role: Role.DRIVER,
                isDriverApproved: true
            }
        });
        driverId = driver.id;
        driverToken = signToken({ userId: driverId, email: driver.email, role: driver.role });

        // Create unapproved driver
        const unapprovedDriver = await prisma.user.create({
            data: {
                email: `driver-unapp-${Date.now()}@example.com`,
                firstName: 'Unapproved',
                lastName: 'Driver',
                passwordHash: 'dummyhash',
                role: Role.DRIVER,
                isDriverApproved: false
            }
        });
        unapprovedDriverId = unapprovedDriver.id;
        unapprovedDriverToken = signToken({ userId: unapprovedDriverId, email: unapprovedDriver.email, role: unapprovedDriver.role });

        // Create orders
        const readyOrder = await (prisma.order as any).create({
            data: {
                orderNumber: `GNDRIVER-READY-${Date.now()}`,
                deliveryOTP: '2222',
                userId: customerId,
                storeId,
                subtotal: 10.00,
                deliveryFee: 2.00,
                taxAmount: 0.80,
                totalAmount: 12.80,
                paymentStatus: 'paid',
                status: OrderStatus.READY
            }
        });
        readyOrderId = readyOrder.id;

        const pendingOrder = await (prisma.order as any).create({
            data: {
                orderNumber: `GNDRIVER-PEND-${Date.now()}`,
                deliveryOTP: '3333',
                userId: customerId,
                storeId,
                subtotal: 10.00,
                deliveryFee: 2.00,
                taxAmount: 0.80,
                totalAmount: 12.80,
                paymentStatus: 'paid',
                status: OrderStatus.PENDING
            }
        });
        pendingOrderId = pendingOrder.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: [readyOrderId, pendingOrderId] } } }).catch(() => {});
        await prisma.order.deleteMany({ where: { id: { in: [readyOrderId, pendingOrderId] } } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [customerId, driverId, unapprovedDriverId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('GET /api/driver/available', () => {
        it('should return 403 if driver is not approved', async () => {
            const res = await request(app)
                .get('/api/driver/available')
                .set('Authorization', `Bearer ${unapprovedDriverToken}`);
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Driver is not approved');
        });

        it('should return list of available orders if driver is approved', async () => {
            const res = await request(app)
                .get('/api/driver/available')
                .set('Authorization', `Bearer ${driverToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            const found = res.body.find((o: any) => o.id === readyOrderId);
            expect(found).toBeDefined();
        });

        it('should return 500 on database error', async () => {
            const spy = jest.spyOn(prisma.order, 'findMany').mockRejectedValueOnce(new Error('DB breakdown'));
            const res = await request(app)
                .get('/api/driver/available')
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('POST /api/driver/orders/:orderId/accept', () => {
        it('should return 403 if driver is not approved', async () => {
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/accept`)
                .set('Authorization', `Bearer ${unapprovedDriverToken}`);
            expect(res.status).toBe(403);
        });

        it('should return 400 if order is not READY', async () => {
            const res = await request(app)
                .post(`/api/driver/orders/${pendingOrderId}/accept`)
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Order not available');
        });

        it('should accept the order successfully when it is READY', async () => {
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/accept`)
                .set('Authorization', `Bearer ${driverToken}`);

            expect(res.status).toBe(200);
            expect(res.body.driverId).toBe(driverId);
            expect(res.body.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
        });

        it('should return 500 on database error', async () => {
            const spy = jest.spyOn(prisma.order, 'findUnique').mockRejectedValueOnce(new Error('DB breakdown'));
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/accept`)
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('POST /api/driver/orders/:orderId/deliver', () => {
        it('should return 403 if driver is not approved', async () => {
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/deliver`)
                .set('Authorization', `Bearer ${unapprovedDriverToken}`);
            expect(res.status).toBe(403);
        });

        it('should return 403 if driver is not the one assigned', async () => {
            // Create another order assigned to someone else
            const otherOrder = await (prisma.order as any).create({
                data: {
                    orderNumber: `GNDRIVER-OTHER-${Date.now()}`,
                    deliveryOTP: '4444',
                    userId: customerId,
                    storeId,
                    subtotal: 10.00,
                    deliveryFee: 2.00,
                    taxAmount: 0.80,
                    totalAmount: 12.80,
                    paymentStatus: 'paid',
                    status: OrderStatus.OUT_FOR_DELIVERY,
                    driverId: customerId // assigned to someone else
                }
            });

            const res = await request(app)
                .post(`/api/driver/orders/${otherOrder.id}/deliver`)
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Not authorized');

            await prisma.order.delete({ where: { id: otherOrder.id } });
        });

        it('should deliver the order successfully', async () => {
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/deliver`)
                .set('Authorization', `Bearer ${driverToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(OrderStatus.DELIVERED);
        });

        it('should return 400 for invalid status transition (e.g. deliver already DELIVERED)', async () => {
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/deliver`)
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(400);
        });

        it('should return 500 on database error', async () => {
            const spy = jest.spyOn(prisma.order, 'findUnique').mockRejectedValueOnce(new Error('DB breakdown'));
            const res = await request(app)
                .post(`/api/driver/orders/${readyOrderId}/deliver`)
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('GET /api/driver/my-deliveries', () => {
        it('should return list of my deliveries', async () => {
            const res = await request(app)
                .get('/api/driver/my-deliveries')
                .set('Authorization', `Bearer ${driverToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            const found = res.body.find((o: any) => o.id === readyOrderId);
            expect(found).toBeDefined();
        });

        it('should return 500 on database error', async () => {
            const spy = jest.spyOn(prisma.order, 'findMany').mockRejectedValueOnce(new Error('DB breakdown'));
            const res = await request(app)
                .get('/api/driver/my-deliveries')
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('POST /api/driver/upload-license', () => {
        it('should upload license successfully', async () => {
            const res = await request(app)
                .post('/api/driver/upload-license')
                .set('Authorization', `Bearer ${driverToken}`);

            expect(res.status).toBe(200);
            expect(res.body.licenseUrl).toContain('license');
        });

        it('should return 500 on database error', async () => {
            const spy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce(new Error('DB breakdown'));
            const res = await request(app)
                .post('/api/driver/upload-license')
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('POST /api/driver/upload-insurance', () => {
        it('should upload insurance successfully', async () => {
            const res = await request(app)
                .post('/api/driver/upload-insurance')
                .set('Authorization', `Bearer ${driverToken}`);

            expect(res.status).toBe(200);
            expect(res.body.insuranceUrl).toContain('insurance');
        });

        it('should return 500 on database error', async () => {
            const spy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce(new Error('DB breakdown'));
            const res = await request(app)
                .post('/api/driver/upload-insurance')
                .set('Authorization', `Bearer ${driverToken}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });
});
