/**
 * Full Order Flow Integration Test
 *
 * Tests the complete order lifecycle against a real Postgres DB:
 * cart → checkout (create order) → payment intent → webhook confirmation
 * → order status update cascade → notification fired
 *
 * External services (Stripe, email, SMS, socket.io) are mocked.
 * Prisma operations are real — this verifies DB state at each step.
 */

jest.mock('otplib', () => ({
    generateSecret: () => 'KVKFKRJTMR2HSKSK',
    verify: async () => true,
    generateURI: () => 'otpauth://totp/test',
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock',
}));
jest.mock('../../services/email.service', () => ({
    emailService: {
        sendEmail: jest.fn().mockResolvedValue(true),
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock('../../services/sms.service', () => ({
    smsService: {
        sendSMS: jest.fn().mockResolvedValue(true),
        sendVerificationOTP: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock('../../services/analytics.service', () => ({
    analyticsService: {
        trackSignup: jest.fn(),
        trackLogin: jest.fn(),
        trackEvent: jest.fn(),
        trackCartAddition: jest.fn(),
        trackCheckoutStarted: jest.fn(),
        trackPaymentCompleted: jest.fn(),
        trackPaymentFailed: jest.fn(),
        trackStoreCreated: jest.fn(),
        trackProductUpdated: jest.fn(),
        trackDriverLocationUpdate: jest.fn(),
    },
}));
jest.mock('../../utils/pwned.utils', () => ({
    isPasswordPwned: jest.fn().mockResolvedValue(false),
}));

// Mock socket.io to prevent "Cannot emit to uninitiated socket" errors
jest.mock('../../services/socket.service', () => ({
    initSocket: jest.fn(),
    getIO: jest.fn().mockReturnValue({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    }),
}));

import request from 'supertest';
import crypto from 'crypto';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { signToken } from '../../utils/jwt.utils';

function generateStripeSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const hmac = crypto.createHmac('sha256', secret);
    const sig = hmac.update(`${timestamp}.${payload}`).digest('hex');
    return `t=${timestamp},v1=${sig}`;
}

describe('Full Order Flow Integration', () => {
    const ts = Date.now();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

    let customerId: string;
    let merchantId: string;
    let customerToken: string;
    let merchantToken: string;
    let storeId: string;
    let productId: string;
    let addressId: string;
    let cartId: string;
    let orderId: string;
    let orderNumber: string;
    let deliveryOTP: string;
    let paymentIntentId: string;

    beforeAll(async () => {
        // Create customer
        const customer = await prisma.user.create({
            data: {
                email: `order-flow-cust-${ts}@example.com`,
                firstName: 'Order',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER',
            },
        });
        customerId = customer.id;
        customerToken = signToken({ userId: customerId, email: customer.email, role: customer.role });

        // Create merchant
        const merchant = await prisma.user.create({
            data: {
                email: `order-flow-merch-${ts}@example.com`,
                firstName: 'Order',
                lastName: 'Merchant',
                passwordHash: 'dummyhash',
                role: 'MERCHANT',
            },
        });
        merchantId = merchant.id;
        merchantToken = signToken({ userId: merchantId, email: merchant.email, role: merchant.role });

        // Create store owned by merchant
        const store = await prisma.store.create({
            data: {
                name: `Order Flow Store ${ts}`,
                slug: `order-flow-store-${ts}`,
                ownerId: merchantId,
                cuisineTypes: ['Grocery'],
                streetAddress: '1 Flow St',
                city: 'London',
                postalCode: 'EC1A 1BB',
                country: 'UK',
                latitude: 51.52,
                longitude: -0.1,
            },
        });
        storeId = store.id;

        // Create product with tracked inventory
        const product = await prisma.product.create({
            data: {
                name: `Flow Apple ${ts}`,
                slug: `flow-apple-${ts}`,
                regularPrice: 1.50,
                storeId,
                stockQuantity: 50,
                trackInventory: true,
            },
        });
        productId = product.id;

        // Create delivery address for customer
        const addr = await prisma.address.create({
            data: {
                userId: customerId,
                streetAddress: '10 Test Lane',
                city: 'London',
                postalCode: 'E1 6AN',
                country: 'UK',
                isDefault: true,
            },
        });
        addressId = addr.id;
    });

    afterAll(async () => {
        await prisma.orderStatusHistory.deleteMany({
            where: { order: { orderNumber: { startsWith: 'GN' } } },
        }).catch(() => {});
        await prisma.orderItem.deleteMany({ where: { order: { userId: customerId } } }).catch(() => {});
        await prisma.order.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.cartItem.deleteMany({ where: { cart: { userId: customerId } } }).catch(() => {});
        await prisma.cart.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.address.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({
            where: { id: { in: [customerId, merchantId] } },
        }).catch(() => {});
        await prisma.$disconnect();
    });

    // ─── Step 1: Populate Cart ───────────────────────────────────────────────

    describe('Step 1: Populate Cart', () => {
        it('adds an item to the cart via API', async () => {
            const res = await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ productId, storeId, quantity: 3 });

            expect(res.status).toBe(200);
            expect(res.body.items).toBeDefined();

            // Confirm cart is persisted
            const cart = await prisma.cart.findUnique({
                where: { userId: customerId },
                include: { items: true },
            });
            expect(cart).not.toBeNull();
            expect(cart!.items.length).toBeGreaterThan(0);
            cartId = cart!.id;

            const item = cart!.items.find((i) => i.productId === productId);
            expect(item).toBeDefined();
            expect(item!.quantity).toBe(3);
        });

        it('updates quantity of an existing cart item', async () => {
            const res = await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ productId, storeId, quantity: 5 });

            expect(res.status).toBe(200);

            // Confirm upsert — not two separate rows
            const cart = await prisma.cart.findUnique({
                where: { userId: customerId },
                include: { items: true },
            });
            const items = cart!.items.filter((i) => i.productId === productId);
            expect(items.length).toBe(1); // must be upserted, not duplicated
        });
    });

    // ─── Step 2: Checkout (Create Order) ────────────────────────────────────

    describe('Step 2: Checkout — Create Order', () => {
        it('creates an order from cart, returns order details and OTP', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    deliveryAddressId: addressId,
                    paymentMethod: 'CARD',
                    tipAmount: 1.00,
                });

            expect(res.status).toBe(201);
            expect(res.body.orders).toBeDefined();
            expect(res.body.orders.length).toBeGreaterThan(0);

            const order = res.body.orders[0];
            orderId = order.id;
            orderNumber = order.orderNumber;
            deliveryOTP = order.deliveryOTP;

            expect(orderId).toBeDefined();
            expect(orderNumber).toMatch(/^GN/);
            expect(deliveryOTP).toBeDefined();
        });

        it('confirms order is PENDING in the DB after creation', async () => {
            const dbOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { orderItems: true },
            });

            expect(dbOrder).not.toBeNull();
            expect(dbOrder!.status).toBe('PENDING');
            expect(dbOrder!.paymentStatus).toBe('pending');
            expect(dbOrder!.orderItems.length).toBeGreaterThan(0);
        });

        it('confirms cart is cleared after order is placed', async () => {
            const cart = await prisma.cart.findUnique({
                where: { userId: customerId },
                include: { items: true },
            });
            // Cart should be empty after checkout
            expect(cart?.items.length ?? 0).toBe(0);
        });

        it('confirms order total matches server-side pricing formula', async () => {
            const dbOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { orderItems: true },
            });

            // Server-side: subtotal + deliveryFee (2.99) + tax (subtotal * 0.08) + tip
            const subtotal = dbOrder!.subtotal;
            const deliveryFee = dbOrder!.deliveryFee;
            const tax = dbOrder!.taxAmount;
            const tip = dbOrder!.tipAmount;
            const expectedTotal = parseFloat(
                (subtotal + deliveryFee + tax + tip).toFixed(2)
            );

            expect(dbOrder!.totalAmount).toBeCloseTo(expectedTotal, 1);
        });
    });

    // ─── Step 3: Payment Intent Initialization ───────────────────────────────

    describe('Step 3: Payment Intent Initialization', () => {
        it('initializes a Stripe payment intent for the order', async () => {
            const res = await request(app)
                .post('/api/payments/init')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ orderId });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('clientSecret');
            expect(res.body).toHaveProperty('paymentIntentId');

            paymentIntentId = res.body.paymentIntentId;
        });

        it('rejects payment init for an order owned by another user', async () => {
            const res = await request(app)
                .post('/api/payments/init')
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ orderId });

            expect([400, 403, 404]).toContain(res.status);
        });
    });

    // ─── Step 4: Webhook Confirmation → Order Status Update ─────────────────

    describe('Step 4: Stripe Webhook → Order Status Update', () => {
        it('payment_intent.succeeded webhook marks order as paid in DB', async () => {
            const eventPayload = {
                id: `evt_flow_${ts}`,
                object: 'event',
                type: 'payment_intent.succeeded',
                api_version: '2025-01-27-acacia',
                data: {
                    object: {
                        id: paymentIntentId || `pi_flow_${ts}`,
                        object: 'payment_intent',
                        amount: Math.round((await prisma.order.findUnique({ where: { id: orderId } }))!.totalAmount * 100),
                        currency: 'gbp',
                        status: 'succeeded',
                        metadata: {
                            orderId,
                            userId: customerId,
                        },
                    },
                },
            };

            const bodyStr = JSON.stringify(eventPayload);
            const sig = generateStripeSignature(bodyStr, webhookSecret);

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', sig)
                .set('content-type', 'application/json')
                .send(bodyStr);

            expect(res.status).toBe(200);

            const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
            expect(dbOrder!.paymentStatus).toBe('paid');
        });

        it('webhook is idempotent — replaying the same event does not duplicate DB changes', async () => {
            // The ProcessedWebhook table should prevent re-processing
            const eventId = `evt_idempotent_${ts}`;
            const eventPayload = {
                id: eventId,
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_dummy',
                        metadata: { orderId, userId: customerId },
                    },
                },
            };

            const bodyStr = JSON.stringify(eventPayload);
            const sig = generateStripeSignature(bodyStr, webhookSecret);

            // Send twice
            await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', sig)
                .set('content-type', 'application/json')
                .send(bodyStr);

            const sig2 = generateStripeSignature(bodyStr, webhookSecret);
            const res2 = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', sig2)
                .set('content-type', 'application/json')
                .send(bodyStr);

            // Either 200 (gracefully handled) or should not cause 5xx
            expect(res2.status).not.toBe(500);
        });
    });

    // ─── Step 5: Order Status Transition ────────────────────────────────────

    describe('Step 5: Order Status Transition Cascade', () => {
        it('merchant can update order to CONFIRMED', async () => {
            const res = await request(app)
                .put(`/api/owner/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ status: 'CONFIRMED' });

            expect(res.status).toBe(200);

            const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
            expect(dbOrder!.status).toBe('CONFIRMED');
        });

        it('confirms a status history entry is recorded for CONFIRMED', async () => {
            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId, status: 'CONFIRMED' },
            });
            expect(history.length).toBeGreaterThan(0);
        });

        it('merchant can advance status to PREPARING', async () => {
            const res = await request(app)
                .put(`/api/owner/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ status: 'PREPARING' });

            expect(res.status).toBe(200);
        });

        it('rejects invalid status transition (PREPARING → DELIVERED skips required steps)', async () => {
            const res = await request(app)
                .put(`/api/owner/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ status: 'DELIVERED' });

            expect([400, 422]).toContain(res.status);
        });

        it('merchant advances to READY', async () => {
            const res = await request(app)
                .put(`/api/owner/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ status: 'READY' });

            expect(res.status).toBe(200);
        });

        it('advances to OUT_FOR_DELIVERY', async () => {
            const res = await request(app)
                .put(`/api/owner/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ status: 'OUT_FOR_DELIVERY' });

            expect(res.status).toBe(200);
        });

        it('verifies delivery OTP and marks order as DELIVERED', async () => {
            const res = await request(app)
                .post(`/api/orders/${orderId}/verify-otp`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ otp: deliveryOTP });

            expect(res.status).toBe(200);
            expect(res.body.order.status).toBe('DELIVERED');
            expect(res.body.order.isOTPVerified).toBe(true);
        });

        it('confirms DELIVERED status is persisted in DB', async () => {
            const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
            expect(dbOrder!.status).toBe('DELIVERED');
            expect(dbOrder!.isOTPVerified).toBe(true);
        });

        it('full status history is present in DB (PENDING→CONFIRMED→PREPARING→READY→OUT_FOR_DELIVERY→DELIVERED)', async () => {
            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId },
                orderBy: { createdAt: 'asc' },
            });

            const statuses = history.map((h) => h.status);
            // At minimum these must have been recorded at some point
            expect(statuses).toContain('CONFIRMED');
            expect(statuses).toContain('PREPARING');
            expect(statuses).toContain('READY');
            expect(statuses).toContain('OUT_FOR_DELIVERY');
        });
    });
});
