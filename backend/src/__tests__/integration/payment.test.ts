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
import crypto from 'crypto';

function generateStripeSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    const signatureHash = hmac.update(signaturePayload).digest('hex');
    return `t=${timestamp},v1=${signatureHash}`;
}

describe('Stripe Webhook and Payment Integration Tests', () => {
    let customerId: string;
    let storeId: string;
    let productId: string;
    let orderId: string;
    let authToken: string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

    beforeAll(async () => {
        // Create customer user
        const customer = await prisma.user.create({
            data: {
                email: `payment-test-${Date.now()}@example.com`,
                firstName: 'Payment',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        customerId = customer.id;

        // Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: customer.email,
                password: 'GrocNest-Secure-Pass-2026!' // Wait, the register endpoint creates a user with this dummy pass, let's login directly or sign a token
            });

        // Let's sign a token directly for customerId to avoid login password hashing mismatch
        const { signToken } = require('../../utils/jwt.utils');
        authToken = signToken({ userId: customerId, email: customer.email, role: customer.role });

        // Create store and product to build order
        const merchant = await prisma.user.create({
            data: {
                email: `merchant-payment-${Date.now()}@example.com`,
                firstName: 'Payment',
                lastName: 'Merchant',
                passwordHash: 'dummyhash',
                role: 'MERCHANT'
            }
        });

        const store = await prisma.store.create({
            data: {
                name: 'Payment Test Store',
                slug: `payment-test-store-${Date.now()}`,
                ownerId: merchant.id,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 Pay St',
                city: 'London',
                postalCode: 'E1 6AN',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1
            }
        });
        storeId = store.id;

        const product = await prisma.product.create({
            data: {
                name: 'Payment Test Product',
                slug: `pay-product-${Date.now()}`,
                regularPrice: 10.00,
                storeId: storeId,
                stockQuantity: 100
            }
        });
        productId = product.id;

        // Create address
        const address = await prisma.address.create({
            data: {
                userId: customerId,
                streetAddress: '123 Pay St',
                city: 'London',
                postalCode: 'E1 6AN',
                country: 'UK',
                isDefault: true
            }
        });

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-${Date.now()}`,
                userId: customerId,
                storeId: storeId,
                deliveryAddressId: address.id,
                subtotal: 10.00,
                deliveryFee: 2.00,
                taxAmount: 1.00,
                tipAmount: 2.00,
                totalAmount: 15.00,
                paymentStatus: 'pending',
                status: 'PENDING'
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        // Cleanup database
        await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
        await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.address.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: customerId } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('POST /api/payments/init', () => {
        it('should initialize payment intent successfully', async () => {
            const res = await request(app)
                .post('/api/payments/init')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ orderId });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('clientSecret');
            expect(res.body).toHaveProperty('paymentIntentId');
        });

        it('should reject payment initialization with total amount mismatch', async () => {
            // Tamper order amount in DB
            await prisma.order.update({
                where: { id: orderId },
                data: { totalAmount: 100.00 } // Total does not match subtotal + fees
            });

            const res = await request(app)
                .post('/api/payments/init')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ orderId });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid order total');

            // Restore order amount
            await prisma.order.update({
                where: { id: orderId },
                data: { totalAmount: 15.00 }
            });
        });
    });

    describe('POST /api/payments/webhook', () => {
        it('should process payment_intent.succeeded webhook successfully with valid signature', async () => {
            const eventPayload = {
                id: `evt_test_${Date.now()}`,
                object: 'event',
                type: 'payment_intent.succeeded',
                api_version: '2025-01-27-acacia',
                data: {
                    object: {
                        id: 'pi_test_succeeded',
                        object: 'payment_intent',
                        amount: 1500,
                        currency: 'usd',
                        status: 'succeeded',
                        metadata: {
                            orderId: orderId,
                            userId: customerId
                        }
                    }
                }
            };

            const payloadString = JSON.stringify(eventPayload);
            const signature = generateStripeSignature(payloadString, webhookSecret);

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', signature)
                .set('content-type', 'application/json')
                .send(payloadString);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ received: true });

            // Verify order status updated to paid in database
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });
            expect(order?.paymentStatus).toBe('paid');
        });

        it('should reject webhook request with missing signature', async () => {
            const eventPayload = {
                id: 'evt_test_missing_sig',
                object: 'event',
                type: 'payment_intent.succeeded'
            };

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('content-type', 'application/json')
                .send(eventPayload);

            expect(res.status).toBe(400);
            expect(res.text).toContain('Missing signature');
        });

        it('should reject webhook request with wrong/invalid signature', async () => {
            const eventPayload = {
                id: 'evt_test_wrong_sig',
                object: 'event',
                type: 'payment_intent.succeeded'
            };
            const payloadString = JSON.stringify(eventPayload);
            const badSignature = generateStripeSignature(payloadString, 'wrong_secret');

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', badSignature)
                .set('content-type', 'application/json')
                .send(payloadString);

            expect(res.status).toBe(400);
            expect(res.text).toContain('Webhook Error');
        });

        it('should reject webhook request with tampered body', async () => {
            const eventPayload = {
                id: 'evt_test_tampered',
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_test_succeeded',
                        metadata: { orderId }
                    }
                }
            };
            const payloadString = JSON.stringify(eventPayload);
            const signature = generateStripeSignature(payloadString, webhookSecret);

            // Send tampered body by changing the event ID in payload after generating signature
            const tamperedPayload = payloadString.replace('evt_test_tampered', 'evt_test_tampered_malicious');

            const res = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', signature)
                .set('content-type', 'application/json')
                .send(tamperedPayload);

            expect(res.status).toBe(400);
            expect(res.text).toContain('Webhook Error');
        });
    });
});
