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
        trackPaymentCompleted: jest.fn(),
        trackPaymentFailed: jest.fn(),
    },
}));
jest.mock('../../utils/pwned.utils', () => ({
    isPasswordPwned: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../services/socket.service', () => ({
    initSocket: jest.fn(),
    getIO: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }),
}));

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { verifyWebhookSignature } from '../../services/stripe.service';

jest.mock('../../services/stripe.service', () => {
    const original = jest.requireActual('../../services/stripe.service');
    return {
        ...original,
        verifyWebhookSignature: jest.fn(),
    };
});

describe('Stripe Webhook Burst & Idempotency Test', () => {
    const ts = Date.now();
    const burstEventId = `evt_burst_test_${ts}`;
    let testOrderId: string;
    let customerId: string;
    let storeId: string;

    beforeAll(async () => {
        const c = await prisma.user.create({
            data: { email: `wh-customer-${ts}@example.com`, passwordHash: 'dummy', role: 'CUSTOMER' },
        });
        customerId = c.id;

        const m = await prisma.user.create({
            data: { email: `wh-merchant-${ts}@example.com`, passwordHash: 'dummy', role: 'MERCHANT' },
        });

        const s = await prisma.store.create({
            data: {
                name: `WH Store ${ts}`,
                slug: `wh-store-${ts}`,
                ownerId: m.id,
                cuisineTypes: ['Grocery'],
                streetAddress: '1 WH St',
                city: 'London',
                postalCode: 'E1 1AA',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1,
            },
        });
        storeId = s.id;

        const o = await prisma.order.create({
            data: {
                orderNumber: `GNS-WH-${ts}`,
                userId: customerId,
                storeId: storeId,
                subtotal: 10.00,
                deliveryFee: 2.99,
                taxAmount: 0.80,
                totalAmount: 13.79,
                deliveryOTP: '9999',
                status: 'PENDING',
                paymentStatus: 'unpaid',
                paymentIntentId: `pi_burst_test_${ts}`,
            },
        });
        testOrderId = o.id;

        // Mock Stripe signature verification to return the test event object
        (verifyWebhookSignature as jest.Mock).mockReturnValue({
            id: burstEventId,
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: `pi_burst_test_${ts}`,
                    amount: 1379,
                    metadata: { orderId: testOrderId, userId: customerId },
                },
            },
        });
    });

    afterAll(async () => {
        await prisma.orderStatusHistory.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
        await prisma.order.deleteMany({ where: { id: testOrderId } }).catch(() => {});
        await prisma.processedWebhook.deleteMany({ where: { eventId: burstEventId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { email: { in: [`wh-customer-${ts}@example.com`, `wh-merchant-${ts}@example.com`] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('processes exactly 1 webhook and safely deduplicates 20 parallel duplicate webhooks', async () => {
        // Fire 20 duplicate webhook events concurrently
        const webhookPromises = Array.from({ length: 20 }).map(() =>
            request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', 'valid_mock_signature')
                .send({ type: 'payment_intent.succeeded' })
        );

        const responses = await Promise.all(webhookPromises);

        const status200s = responses.filter((r) => r.status === 200);
        console.log(`[Webhook Idempotency SLA] Received ${status200s.length} / 20 HTTP 200 responses`);

        // All 20 requests must return 200 OK (no 500 crashes)
        expect(status200s.length).toBe(20);

        // Verify ProcessedWebhook table has EXACTLY 1 entry for this event ID
        const processedRecords = await prisma.processedWebhook.findMany({
            where: { eventId: burstEventId },
        });
        console.log(`[Webhook Idempotency SLA] ProcessedWebhook records count = ${processedRecords.length}`);
        expect(processedRecords.length).toBe(1);

        // Verify paymentStatus updated to paid
        const order = await prisma.order.findUnique({ where: { id: testOrderId } });
        expect(order?.paymentStatus).toBe('paid');

        // Verify order status history contains EXACTLY 1 transition record
        const historyRecords = await prisma.orderStatusHistory.findMany({
            where: { orderId: testOrderId },
        });
        expect(historyRecords.length).toBe(1);
    });
});
