/**
 * Concurrent Write Integration Test
 *
 * Tests race conditions against the real Postgres DB using Promise.all() to
 * fire simultaneous requests. Verifies that:
 *
 * 1. Two concurrent "add to cart" calls don't duplicate cart items (upsert safety).
 * 2. Simultaneous order placements against limited stock don't cause inventory
 *    to go negative (lost-update prevention).
 * 3. Two concurrent order status updates don't cause a data race or leave the
 *    order in an invalid intermediate state.
 *
 * These tests REQUIRE a real DB — mocks cannot detect lost-update bugs.
 * They use Postgres transaction isolation to verify correctness.
 *
 * NOTE: If the application does not yet implement SELECT ... FOR UPDATE or
 * optimistic locking for inventory, tests will demonstrate the bug (intentional).
 * The test assertions document the INTENDED behavior as the acceptance criteria.
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
    emailService: { sendEmail: jest.fn(), sendVerificationEmail: jest.fn(), sendOrderConfirmationEmail: jest.fn() },
}));
jest.mock('../../services/sms.service', () => ({
    smsService: { sendSMS: jest.fn(), sendVerificationOTP: jest.fn() },
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
jest.mock('../../services/socket.service', () => ({
    initSocket: jest.fn(),
    getIO: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }),
}));

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { signToken } from '../../utils/jwt.utils';

describe('Concurrent Write Tests (Real DB)', () => {
    const ts = Date.now();

    let customer1Id: string;
    let customer2Id: string;
    let customer1Token: string;
    let customer2Token: string;
    let merchantId: string;
    let storeId: string;
    let productId: string;
    let address1Id: string;
    let address2Id: string;

    beforeAll(async () => {
        // Create merchant + store + product with limited stock
        const merchant = await prisma.user.create({
            data: {
                email: `concurrent-merch-${ts}@example.com`,
                passwordHash: 'hash',
                role: 'MERCHANT',
            },
        });
        merchantId = merchant.id;

        const store = await prisma.store.create({
            data: {
                name: `Concurrent Store ${ts}`,
                slug: `concurrent-store-${ts}`,
                ownerId: merchantId,
                cuisineTypes: ['Grocery'],
                streetAddress: '1 Race Condition Rd',
                city: 'London',
                postalCode: 'E1 1AA',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1,
            },
        });
        storeId = store.id;

        const product = await prisma.product.create({
            data: {
                name: `Concurrent Product ${ts}`,
                slug: `concurrent-prod-${ts}`,
                regularPrice: 2.99,
                storeId,
                stockQuantity: 5, // Limited stock — key for race condition test
                trackInventory: true,
            },
        });
        productId = product.id;

        // Create two customers with addresses (they will race each other)
        const c1 = await prisma.user.create({
            data: {
                email: `concurrent-c1-${ts}@example.com`,
                passwordHash: 'hash',
                role: 'CUSTOMER',
            },
        });
        customer1Id = c1.id;
        customer1Token = signToken({ userId: customer1Id, email: c1.email, role: c1.role });

        const a1 = await prisma.address.create({
            data: {
                userId: customer1Id,
                streetAddress: '1 Customer Rd',
                city: 'London',
                postalCode: 'E1 1AA',
                country: 'UK',
            },
        });
        address1Id = a1.id;

        const c2 = await prisma.user.create({
            data: {
                email: `concurrent-c2-${ts}@example.com`,
                passwordHash: 'hash',
                role: 'CUSTOMER',
            },
        });
        customer2Id = c2.id;
        customer2Token = signToken({ userId: customer2Id, email: c2.email, role: c2.role });

        const a2 = await prisma.address.create({
            data: {
                userId: customer2Id,
                streetAddress: '2 Customer Rd',
                city: 'London',
                postalCode: 'E1 1BB',
                country: 'UK',
            },
        });
        address2Id = a2.id;
    });

    afterAll(async () => {
        // Full teardown in dependency order
        await prisma.orderStatusHistory.deleteMany({
            where: { order: { userId: { in: [customer1Id, customer2Id] } } },
        }).catch(() => {});
        await prisma.orderItem.deleteMany({
            where: { order: { userId: { in: [customer1Id, customer2Id] } } },
        }).catch(() => {});
        await prisma.order.deleteMany({
            where: { userId: { in: [customer1Id, customer2Id] } },
        }).catch(() => {});
        await prisma.cartItem.deleteMany({
            where: { cart: { userId: { in: [customer1Id, customer2Id] } } },
        }).catch(() => {});
        await prisma.cart.deleteMany({
            where: { userId: { in: [customer1Id, customer2Id] } },
        }).catch(() => {});
        await prisma.address.deleteMany({
            where: { id: { in: [address1Id, address2Id] } },
        }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({
            where: { id: { in: [customer1Id, customer2Id, merchantId] } },
        }).catch(() => {});
        await prisma.$disconnect();
    });

    // ─── Test 1: Concurrent cart upserts ─────────────────────────────────────

    describe('Concurrent "add to cart" calls — no duplicated cart items', () => {
        it('simultaneous add-to-cart for the same product does not create duplicate rows', async () => {
            // Fire 5 concurrent add-to-cart requests for the same product
            const requests = Array.from({ length: 5 }, () =>
                request(app)
                    .post('/api/cart/items')
                    .set('Authorization', `Bearer ${customer1Token}`)
                    .send({ productId, storeId, quantity: 1 })
            );

            const results = await Promise.all(requests);

            // All should succeed (or at worst return a conflict — not 500)
            for (const res of results) {
                expect(res.status).not.toBe(500);
            }

            // Critically: only ONE cart item row should exist for this product
            const cart = await prisma.cart.findUnique({
                where: { userId: customer1Id },
                include: { items: { where: { productId } } },
            });

            expect(cart).not.toBeNull();
            expect(cart!.items.length).toBe(1); // Exactly one row — no duplicates
        });
    });

    // ─── Test 2: Concurrent order placement — inventory integrity ─────────────

    describe('Concurrent order placement — inventory must not go below zero', () => {
        beforeAll(async () => {
            // Set product stock to exactly 1 — only one order should succeed
            await prisma.product.update({
                where: { id: productId },
                data: { stockQuantity: 1 },
            });

            // Add product to both customers' carts
            const cart1 = await prisma.cart.upsert({
                where: { userId: customer1Id },
                create: { userId: customer1Id },
                update: {},
            });
            await prisma.cartItem.create({
                data: { cartId: cart1.id, productId, storeId, quantity: 1 },
            });

            const cart2 = await prisma.cart.upsert({
                where: { userId: customer2Id },
                create: { userId: customer2Id },
                update: {},
            });
            await prisma.cartItem.create({
                data: { cartId: cart2.id, productId, storeId, quantity: 1 },
            });
        });

        it('only one of two concurrent orders succeeds when stock is 1', async () => {
            // Both customers try to place an order simultaneously
            const [res1, res2] = await Promise.all([
                request(app)
                    .post('/api/orders')
                    .set('Authorization', `Bearer ${customer1Token}`)
                    .send({ deliveryAddressId: address1Id, paymentMethod: 'CARD' }),
                request(app)
                    .post('/api/orders')
                    .set('Authorization', `Bearer ${customer2Token}`)
                    .send({ deliveryAddressId: address2Id, paymentMethod: 'CARD' }),
            ]);

            const statuses = [res1.status, res2.status];
            const successes = statuses.filter((s) => s === 201).length;
            const failures = statuses.filter((s) => s >= 400).length;

            // INTENDED: at most one order should succeed
            // If both succeed, the application has a lost-update bug
            expect(successes).toBeLessThanOrEqual(1);
            expect(failures).toBeGreaterThanOrEqual(1);

            // Verify stock did not go negative
            const product = await prisma.product.findUnique({ where: { id: productId } });
            expect(product!.stockQuantity).toBeGreaterThanOrEqual(0);
        });
    });

    // ─── Test 3: Concurrent order status update ───────────────────────────────

    describe('Concurrent order status updates — no invalid intermediate state', () => {
        let testOrderId: string;
        let merchantToken: string;

        beforeAll(async () => {
            merchantToken = signToken({ userId: merchantId, email: `concurrent-merch-${ts}@example.com`, role: 'MERCHANT' });

            // Create a PENDING order for the race test
            const order = await prisma.order.create({
                data: {
                    orderNumber: `GNRACE-${ts}`,
                    userId: customer1Id,
                    storeId,
                    subtotal: 10.00,
                    deliveryFee: 2.99,
                    taxAmount: 0.80,
                    totalAmount: 13.79,
                    deliveryOTP: '9876',
                    status: 'PENDING',
                },
            });
            testOrderId = order.id;
        });

        afterAll(async () => {
            await prisma.orderStatusHistory.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
            await prisma.order.deleteMany({ where: { id: testOrderId } }).catch(() => {});
        });

        it('two concurrent status updates to CONFIRMED result in exactly CONFIRMED status (no torn write)', async () => {
            // Both requests try to update PENDING → CONFIRMED at the same time
            const [res1, res2] = await Promise.all([
                request(app)
                    .put(`/api/owner/orders/${testOrderId}/status`)
                    .set('Authorization', `Bearer ${merchantToken}`)
                    .send({ status: 'CONFIRMED' }),
                request(app)
                    .put(`/api/owner/orders/${testOrderId}/status`)
                    .set('Authorization', `Bearer ${merchantToken}`)
                    .send({ status: 'CONFIRMED' }),
            ]);

            // At least one must succeed
            const atLeastOneOk = res1.status === 200 || res2.status === 200;
            expect(atLeastOneOk).toBe(true);

            // Final DB state must be exactly CONFIRMED — not corrupted
            const dbOrder = await prisma.order.findUnique({ where: { id: testOrderId } });
            expect(dbOrder!.status).toBe('CONFIRMED');

            // No 500 errors from either request
            expect(res1.status).not.toBe(500);
            expect(res2.status).not.toBe(500);
        });
    });
});
