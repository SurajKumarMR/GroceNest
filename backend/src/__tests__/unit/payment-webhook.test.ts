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

describe('Payment Webhook Processing Unit Tests', () => {
    let customerId: string;
    let storeId: string;
    let orderId: string;
    const paymentIntentId = `pi_webhook_unit_${Date.now()}`;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

    beforeAll(async () => {
        const ts = Date.now();
        const customer = await prisma.user.create({
            data: {
                email: `wh-unit-cust-${ts}@example.com`,
                firstName: 'Webhook',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        customerId = customer.id;

        const merchant = await prisma.user.create({
            data: {
                email: `wh-unit-merch-${ts}@example.com`,
                firstName: 'Webhook',
                lastName: 'Merchant',
                passwordHash: 'dummyhash',
                role: 'MERCHANT'
            }
        });

        const store = await prisma.store.create({
            data: {
                name: 'Webhook Unit Store',
                slug: `wh-unit-store-${ts}`,
                ownerId: merchant.id,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 Webhook St',
                city: 'London',
                postalCode: 'E1 6AN',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1
            }
        });
        storeId = store.id;

        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-WH-${ts}`,
                userId: customerId,
                storeId: storeId,
                subtotal: 20.00,
                deliveryFee: 3.00,
                taxAmount: 2.00,
                tipAmount: 0.00,
                totalAmount: 25.00,
                paymentStatus: 'pending',
                paymentIntentId: paymentIntentId,
                status: 'PENDING'
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
        await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: customerId } }).catch(() => {});
        await prisma.processedWebhook.deleteMany({ where: { eventId: { startsWith: 'evt_wh_unit_' } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('payment_intent.succeeded', () => {
        it('should update paymentStatus to paid, add OrderStatusHistory and return 200', async () => {
            const eventPayload = {
                id: `evt_wh_unit_succeeded_${Date.now()}`,
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: paymentIntentId,
                        object: 'payment_intent',
                        amount: 2500,
                        currency: 'gbp',
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

            const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
            expect(updatedOrder?.paymentStatus).toBe('paid');

            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId, status: 'PAID' }
            });
            expect(history.length).toBeGreaterThan(0);
        });

        it('should fallback to order lookup via paymentIntentId when metadata orderId is missing', async () => {
            // Create a second order with a unique paymentIntentId
            const fallbackPi = `pi_fallback_${Date.now()}`;
            const fallbackOrder = await prisma.order.create({
                data: {
                    orderNumber: `ORD-FB-${Date.now()}`,
                    userId: customerId,
                    storeId: storeId,
                    subtotal: 10.00,
                    deliveryFee: 2.00,
                    taxAmount: 1.00,
                    totalAmount: 13.00,
                    paymentStatus: 'pending',
                    paymentIntentId: fallbackPi,
                    status: 'PENDING'
                }
            });

            const eventPayload = {
                id: `evt_wh_unit_fallback_${Date.now()}`,
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: fallbackPi,
                        object: 'payment_intent',
                        amount: 1300,
                        metadata: {} // missing orderId
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
            const updated = await prisma.order.findUnique({ where: { id: fallbackOrder.id } });
            expect(updated?.paymentStatus).toBe('paid');

            // Cleanup fallback order
            await prisma.orderStatusHistory.deleteMany({ where: { orderId: fallbackOrder.id } });
            await prisma.order.delete({ where: { id: fallbackOrder.id } });
        });
    });

    describe('payment_intent.payment_failed', () => {
        it('should update paymentStatus to failed and record failure reason', async () => {
            const failPi = `pi_fail_${Date.now()}`;
            const failOrder = await prisma.order.create({
                data: {
                    orderNumber: `ORD-FAIL-${Date.now()}`,
                    userId: customerId,
                    storeId: storeId,
                    subtotal: 15.00,
                    deliveryFee: 2.00,
                    taxAmount: 1.00,
                    totalAmount: 18.00,
                    paymentStatus: 'pending',
                    paymentIntentId: failPi,
                    status: 'PENDING'
                }
            });

            const eventPayload = {
                id: `evt_wh_unit_failed_${Date.now()}`,
                object: 'event',
                type: 'payment_intent.payment_failed',
                data: {
                    object: {
                        id: failPi,
                        object: 'payment_intent',
                        amount: 1800,
                        last_payment_error: {
                            message: 'Card declined due to insufficient funds'
                        },
                        metadata: {
                            orderId: failOrder.id,
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

            const updatedOrder = await prisma.order.findUnique({ where: { id: failOrder.id } });
            expect(updatedOrder?.paymentStatus).toBe('failed');

            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId: failOrder.id, status: 'PAYMENT_FAILED' }
            });
            expect(history.length).toBe(1);
            expect(history[0].note).toContain('Card declined due to insufficient funds');

            // Cleanup
            await prisma.orderStatusHistory.deleteMany({ where: { orderId: failOrder.id } });
            await prisma.order.delete({ where: { id: failOrder.id } });
        });
    });

    describe('charge.refunded', () => {
        it('should update paymentStatus to refunded and record refund amount in history', async () => {
            const refundPi = `pi_refund_${Date.now()}`;
            const refundOrder = await prisma.order.create({
                data: {
                    orderNumber: `ORD-REF-${Date.now()}`,
                    userId: customerId,
                    storeId: storeId,
                    subtotal: 30.00,
                    deliveryFee: 5.00,
                    taxAmount: 2.00,
                    totalAmount: 37.00,
                    paymentStatus: 'paid',
                    paymentIntentId: refundPi,
                    status: 'CONFIRMED'
                }
            });

            const eventPayload = {
                id: `evt_wh_unit_refunded_${Date.now()}`,
                object: 'event',
                type: 'charge.refunded',
                data: {
                    object: {
                        id: `ch_refund_${Date.now()}`,
                        object: 'charge',
                        amount_refunded: 3700,
                        payment_intent: refundPi,
                        metadata: {
                            orderId: refundOrder.id
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

            const updatedOrder = await prisma.order.findUnique({ where: { id: refundOrder.id } });
            expect(updatedOrder?.paymentStatus).toBe('refunded');

            const history = await prisma.orderStatusHistory.findMany({
                where: { orderId: refundOrder.id, status: 'REFUNDED' }
            });
            expect(history.length).toBe(1);
            expect(history[0].note).toContain('37.00');

            // Cleanup
            await prisma.orderStatusHistory.deleteMany({ where: { orderId: refundOrder.id } });
            await prisma.order.delete({ where: { id: refundOrder.id } });
        });
    });

    describe('Webhook Idempotency', () => {
        it('should return alreadyProcessed when receiving duplicate webhook event', async () => {
            const eventId = `evt_wh_unit_idempotent_${Date.now()}`;
            const eventPayload = {
                id: eventId,
                object: 'event',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: paymentIntentId,
                        object: 'payment_intent',
                        amount: 2500,
                        metadata: { orderId }
                    }
                }
            };

            const payloadString = JSON.stringify(eventPayload);
            const signature = generateStripeSignature(payloadString, webhookSecret);

            // First send
            const res1 = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', signature)
                .set('content-type', 'application/json')
                .send(payloadString);

            expect(res1.status).toBe(200);

            // Second send (duplicate)
            const signature2 = generateStripeSignature(payloadString, webhookSecret);
            const res2 = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', signature2)
                .set('content-type', 'application/json')
                .send(payloadString);

            expect(res2.status).toBe(200);
            expect(res2.body).toEqual({ received: true, alreadyProcessed: true });
        });
    });
});
