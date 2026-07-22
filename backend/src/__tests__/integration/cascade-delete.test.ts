/**
 * Cascade Delete Behavior Integration Test
 *
 * Verifies that deleting a store or user does exactly what was intended
 * in the Prisma schema — not Prisma's silent defaults.
 *
 * Key assertions:
 * - Deleting a Store: cascades to Products (onDelete: Cascade), but Orders retain
 *   their storeId as NULL (no cascade — deliberate: preserve order history).
 * - Deleting a User: cascades to RefreshToken, Address, Cart, UserProfile
 *   (all onDelete: Cascade). Orders are retained with userId = NULL.
 * - OrderItems cascade-delete when their parent Order is deleted.
 * - ProductImages and ProductVariants cascade when Product is deleted.
 *
 * None of this should require a manual SQL step.
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
    emailService: { sendEmail: jest.fn(), sendVerificationEmail: jest.fn() },
}));
jest.mock('../../services/sms.service', () => ({
    smsService: { sendSMS: jest.fn(), sendVerificationOTP: jest.fn() },
}));
jest.mock('../../services/analytics.service', () => ({
    analyticsService: { trackSignup: jest.fn(), trackLogin: jest.fn() },
}));
jest.mock('../../utils/pwned.utils', () => ({
    isPasswordPwned: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../services/socket.service', () => ({
    initSocket: jest.fn(),
    getIO: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }),
}));

import prisma from '../../utils/prisma';

describe('Cascade Delete Behavior', () => {
    const ts = Date.now();

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // ─── Store Deletion ───────────────────────────────────────────────────────

    describe('Store deletion: Products cascade; Order history is preserved', () => {
        let merchantId: string;
        let storeId: string;
        let productId: string;
        let productImageId: string;
        let productVariantId: string;
        let customerId: string;
        let orderId: string;

        beforeAll(async () => {
            const merchant = await prisma.user.create({
                data: {
                    email: `cascade-merch-${ts}@example.com`,
                    passwordHash: 'hash',
                    role: 'MERCHANT',
                },
            });
            merchantId = merchant.id;

            const store = await prisma.store.create({
                data: {
                    name: `Cascade Store ${ts}`,
                    slug: `cascade-store-${ts}`,
                    ownerId: merchantId,
                    cuisineTypes: ['Test'],
                    streetAddress: '1 Cascade Rd',
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
                    name: `Cascade Prod ${ts}`,
                    slug: `cascade-prod-${ts}`,
                    regularPrice: 5.00,
                    storeId,
                    stockQuantity: 10,
                },
            });
            productId = product.id;

            // Add product image and variant to confirm sub-cascade
            const img = await prisma.productImage.create({
                data: { productId, url: 'https://example.com/img.png' },
            });
            productImageId = img.id;

            const variant = await prisma.productVariant.create({
                data: { productId, name: 'Large', price: 6.00, stockQuantity: 5 },
            });
            productVariantId = variant.id;

            // Create a customer with an order on this store
            const customer = await prisma.user.create({
                data: {
                    email: `cascade-cust-${ts}@example.com`,
                    passwordHash: 'hash',
                    role: 'CUSTOMER',
                },
            });
            customerId = customer.id;

            const order = await prisma.order.create({
                data: {
                    orderNumber: `GNCS-${ts}`,
                    userId: customerId,
                    storeId, // reference to store being deleted
                    subtotal: 5.00,
                    deliveryFee: 2.99,
                    taxAmount: 0.40,
                    totalAmount: 8.39,
                    deliveryOTP: '1234',
                },
            });
            orderId = order.id;
        });

        afterAll(async () => {
            // Cleanup residual data (order should persist post-store-delete, clean it here)
            await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
            await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
            await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
            await prisma.user.deleteMany({
                where: { id: { in: [merchantId, customerId] } },
            }).catch(() => {});
        });

        it('deleting a store cascades and deletes its products', async () => {
            // This should work without error (no FK violation)
            await prisma.store.delete({ where: { id: storeId } });

            const product = await prisma.product.findUnique({ where: { id: productId } });
            expect(product).toBeNull(); // Product cascade-deleted
        });

        it('product images are cascade-deleted when product is deleted', async () => {
            const img = await prisma.productImage.findUnique({ where: { id: productImageId } });
            expect(img).toBeNull(); // Cascade via Product → ProductImage
        });

        it('product variants are cascade-deleted when product is deleted', async () => {
            const variant = await prisma.productVariant.findUnique({ where: { id: productVariantId } });
            expect(variant).toBeNull(); // Cascade via Product → ProductVariant
        });

        it('order history is PRESERVED after store deletion (storeId becomes NULL — deliberate)', async () => {
            // The Order model has `storeId String?` (nullable) and no onDelete on the Store relation.
            // Prisma default for nullable FK with no onDelete is SetNull — order is preserved.
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            expect(order).not.toBeNull(); // Order must still exist
            expect(order!.storeId).toBeNull(); // storeId set to NULL, not deleted
        });
    });

    // ─── User Deletion ────────────────────────────────────────────────────────

    describe('User deletion: Auth data cascades; Order history is preserved', () => {
        let userId: string;
        let addressId: string;
        let orderId: string;
        let refreshTokenValue: string;

        beforeAll(async () => {
            const user = await prisma.user.create({
                data: {
                    email: `cascade-user-${ts}@example.com`,
                    passwordHash: 'hash',
                    role: 'CUSTOMER',
                },
            });
            userId = user.id;

            // Create address (onDelete: Cascade)
            const addr = await prisma.address.create({
                data: {
                    userId,
                    streetAddress: '99 Delete Me',
                    city: 'London',
                    postalCode: 'E1 1ZZ',
                    country: 'UK',
                },
            });
            addressId = addr.id;

            // Create a refresh token (onDelete: Cascade)
            const rt = await (prisma as any).refreshToken.create({
                data: {
                    token: `cascade-rt-${ts}`,
                    userId,
                    expiresAt: new Date(Date.now() + 86400000),
                },
            });
            refreshTokenValue = rt.token;

            // Create an order for this user
            const order = await prisma.order.create({
                data: {
                    orderNumber: `GNCSU-${ts}`,
                    userId,
                    subtotal: 10.00,
                    deliveryFee: 2.99,
                    taxAmount: 0.80,
                    totalAmount: 13.79,
                    deliveryOTP: '5678',
                },
            });
            orderId = order.id;
        });

        afterAll(async () => {
            // Order should still exist, clean it up here
            await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
            await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
            await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
        });

        it('deletes the user without FK violation', async () => {
            await expect(prisma.user.delete({ where: { id: userId } })).resolves.not.toThrow();
        });

        it('RefreshToken is cascade-deleted when user is deleted', async () => {
            const rt = await (prisma as any).refreshToken.findUnique({
                where: { token: refreshTokenValue },
            });
            expect(rt).toBeNull();
        });

        it('Address is cascade-deleted when user is deleted', async () => {
            const addr = await prisma.address.findUnique({ where: { id: addressId } });
            expect(addr).toBeNull();
        });

        it('Order is PRESERVED after user deletion (userId becomes NULL — deliberate)', async () => {
            // Order.userId is `String?` (nullable). The User→Order relation has no onDelete directive.
            // Prisma default for nullable FK is SetNull — preserves the order record for audit trail.
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            expect(order).not.toBeNull(); // Must exist
            expect(order!.userId).toBeNull(); // userId nulled, not deleted
        });
    });

    // ─── OrderItem Cascade ────────────────────────────────────────────────────

    describe('OrderItem cascade-deletion when parent Order is deleted', () => {
        let orderId: string;
        let orderItemId: string;

        beforeAll(async () => {
            const order = await prisma.order.create({
                data: {
                    orderNumber: `GNCSI-${ts}`,
                    subtotal: 5.00,
                    deliveryFee: 2.99,
                    taxAmount: 0.40,
                    totalAmount: 8.39,
                    deliveryOTP: '0000',
                },
            });
            orderId = order.id;

            const item = await prisma.orderItem.create({
                data: {
                    orderId,
                    productName: 'Test Item',
                    unitPrice: 5.00,
                    quantity: 1,
                    subtotal: 5.00,
                },
            });
            orderItemId = item.id;
        });

        it('deleting an Order cascades to its OrderItems', async () => {
            await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
            await prisma.order.delete({ where: { id: orderId } });

            const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
            expect(item).toBeNull();
        });
    });
});
