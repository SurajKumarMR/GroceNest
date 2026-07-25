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

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { signToken } from '../../utils/jwt.utils';
import { createRefund } from '../../services/stripe.service';

describe('Refund Processing Flow Unit Tests', () => {
    let customerId: string;
    let merchantId: string;
    let storeId: string;
    let orderId: string;
    let authToken: string;
    const paymentIntentId = `pi_refund_test_${Date.now()}`;

    beforeAll(async () => {
        const ts = Date.now();
        // Create Customer
        const customer = await prisma.user.create({
            data: {
                email: `refund-cust-${ts}@example.com`,
                firstName: 'Refund',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        customerId = customer.id;
        authToken = signToken({ userId: customerId, email: customer.email, role: customer.role });

        // Create Merchant
        const merchant = await prisma.user.create({
            data: {
                email: `refund-merch-${ts}@example.com`,
                firstName: 'Refund',
                lastName: 'Merchant',
                passwordHash: 'dummyhash',
                role: 'MERCHANT'
            }
        });
        merchantId = merchant.id;

        // Create Store owned by Merchant
        const store = await prisma.store.create({
            data: {
                name: 'Refund Test Store',
                slug: `refund-store-${ts}`,
                ownerId: merchant.id,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 Refund St',
                city: 'London',
                postalCode: 'E1 6AN',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1
            }
        });
        storeId = store.id;

        // Create Paid Order
        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-REF-${ts}`,
                userId: customerId,
                storeId: storeId,
                subtotal: 40.00,
                deliveryFee: 5.00,
                taxAmount: 3.00,
                tipAmount: 2.00,
                totalAmount: 50.00,
                paymentStatus: 'paid',
                paymentIntentId: paymentIntentId,
                status: 'CONFIRMED'
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        await prisma.notificationLog.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.notification.deleteMany({ where: { userId: { in: [customerId, merchantId] } } }).catch(() => {});
        await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
        await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [customerId, merchantId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('Stripe Service: createRefund', () => {
        it('should generate a valid refund object in development/test environment', async () => {
            const refund = await createRefund(paymentIntentId, 50.00, 'requested_by_customer');
            expect(refund).toHaveProperty('id');
            expect(refund.id).toMatch(/^re_/);
            expect(refund.amount).toBe(5000);
            expect(refund.status).toBe('succeeded');
        });
    });

    describe('POST /api/payments/refund', () => {
        it('should successfully initiate and process full refund, update DB, and notify customer & merchant', async () => {
            const res = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    orderId: orderId,
                    amount: 50.00,
                    reason: 'Item out of stock'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Refund processed successfully');
            expect(res.body.order.paymentStatus).toBe('refunded');
            expect(res.body.refund).toBeDefined();

            // 1. Verify DB order payment status updated
            const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
            expect(dbOrder?.paymentStatus).toBe('refunded');

            // 2. Verify OrderStatusHistory record created
            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId, status: 'REFUNDED' }
            });
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].note).toContain('£50.00');
            expect(history[0].note).toContain('Item out of stock');

            // 3. Verify Customer Notification created
            const customerNotifications = await prisma.notification.findMany({
                where: { userId: customerId, type: 'order' }
            });
            expect(customerNotifications.length).toBeGreaterThan(0);
            expect(customerNotifications[0].title).toBe('Refund Processed');
            expect(customerNotifications[0].message).toContain('£50.00');

            // 4. Verify Merchant Notification created
            const merchantNotifications = await prisma.notification.findMany({
                where: { userId: merchantId, type: 'order' }
            });
            expect(merchantNotifications.length).toBeGreaterThan(0);
            expect(merchantNotifications[0].title).toBe('Order Refunded');
            expect(merchantNotifications[0].message).toContain('£50.00');
        });

        it('should reject refund request for already refunded order', async () => {
            const res = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    orderId: orderId,
                    amount: 50.00
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Order is already refunded');
        });

        it('should reject refund request without orderId', async () => {
            const res = await request(app)
                .post('/api/payments/refund')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('orderId is required');
        });
    });
});
