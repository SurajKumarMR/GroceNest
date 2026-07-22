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

describe('Concurrent Inventory Race Condition Test', () => {
    const ts = Date.now();

    let merchantId: string;
    let storeId: string;
    let limitedProductId: string;
    let customerTokens: string[] = [];
    let customerIds: string[] = [];
    let addressIds: string[] = [];

    beforeAll(async () => {
        // Merchant & Store setup
        const m = await prisma.user.create({
            data: { email: `race-m-${ts}@example.com`, passwordHash: 'dummy', role: 'MERCHANT' },
        });
        merchantId = m.id;

        const s = await prisma.store.create({
            data: {
                name: `Race Store ${ts}`,
                slug: `race-store-${ts}`,
                ownerId: merchantId,
                cuisineTypes: ['Grocery'],
                streetAddress: '1 Race St',
                city: 'London',
                postalCode: 'E1 1AA',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1,
            },
        });
        storeId = s.id;

        // Limited-stock product with EXACTLY 1 unit remaining
        const p = await prisma.product.create({
            data: {
                name: `Limited Edition Playstation ${ts}`,
                slug: `ps5-limited-${ts}`,
                regularPrice: 499.99,
                storeId: storeId,
                stockQuantity: 1, // Only 1 unit in stock!
            },
        });
        limitedProductId = p.id;

        // Create 10 concurrent buyers
        for (let i = 0; i < 10; i++) {
            const u = await prisma.user.create({
                data: { email: `buyer-${i}-${ts}@example.com`, passwordHash: 'dummy', role: 'CUSTOMER' },
            });
            customerIds.push(u.id);
            customerTokens.push(signToken({ userId: u.id, email: u.email, role: u.role }));

            const addr = await prisma.address.create({
                data: {
                    userId: u.id,
                    streetAddress: '10 Race St',
                    city: 'London',
                    postalCode: 'E1 1AA',
                    country: 'UK',
                },
            });
            addressIds.push(addr.id);

            // Populate each buyer's cart with 1 unit of limited item
            const cart = await prisma.cart.create({ data: { userId: u.id } });
            await prisma.cartItem.create({
                data: { cartId: cart.id, storeId: storeId, productId: limitedProductId, quantity: 1 },
            });
        }
    });

    afterAll(async () => {
        await prisma.orderStatusHistory.deleteMany({ where: { order: { storeId: storeId } } }).catch(() => {});
        await prisma.orderItem.deleteMany({ where: { order: { storeId: storeId } } }).catch(() => {});
        await prisma.order.deleteMany({ where: { storeId: storeId } }).catch(() => {});
        await prisma.address.deleteMany({ where: { id: { in: addressIds } } }).catch(() => {});
        await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: customerIds } } } }).catch(() => {});
        await prisma.cart.deleteMany({ where: { userId: { in: customerIds } } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: limitedProductId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [...customerIds, merchantId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('prevents overselling when 10 buyers simultaneously attempt to purchase the last unit', async () => {
        // Fire 10 parallel HTTP checkout requests at the exact same millisecond
        const checkoutPromises = customerTokens.map((token, index) =>
            request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    deliveryAddressId: addressIds[index],
                    paymentMethod: 'CARD',
                })
        );

        const results = await Promise.all(checkoutPromises);

        const successfulCheckouts = results.filter((res) => res.status === 201);
        const rejectedCheckouts = results.filter((res) => res.status === 400 || res.status === 409);

        console.log(`[Inventory Race SLA] Successful Checkouts: ${successfulCheckouts.length}`);
        console.log(`[Inventory Race SLA] Rejected Checkouts: ${rejectedCheckouts.length}`);

        // Overselling SLA Assertion
        expect(successfulCheckouts.length).toBe(1);
        expect(rejectedCheckouts.length).toBe(9);

        // Verify final database stock is EXACTLY 0 (never negative)
        const updatedProduct = await prisma.product.findUnique({ where: { id: limitedProductId } });
        expect(updatedProduct?.stockQuantity).toBe(0);
        console.log(`[Inventory Race SLA] Final Product Stock = ${updatedProduct?.stockQuantity} (No Overselling)`);
    });
});
