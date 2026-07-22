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
import { autoCancelOrders } from '../../controllers/order.controller';

describe('Order Controller Integration Tests', () => {
    let customer1Id: string;
    let customer1Token: string;
    
    let customer2Id: string;
    let customer2Token: string;
    
    let merchantId: string;
    let merchantToken: string;
    
    let storeId: string;
    let productId: string;
    let address1Id: string;
    let address2Id: string;
    let orderId: string;
    let orderOTP: string;

    beforeAll(async () => {
        // Create Customer 1
        const customer1 = await prisma.user.create({
            data: {
                email: `cust1-order-${Date.now()}@example.com`,
                firstName: 'Cust',
                lastName: 'One',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customer1Id = customer1.id;
        customer1Token = signToken({ userId: customer1Id, email: customer1.email, role: customer1.role });

        // Create Customer 2
        const customer2 = await prisma.user.create({
            data: {
                email: `cust2-order-${Date.now()}@example.com`,
                firstName: 'Cust',
                lastName: 'Two',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customer2Id = customer2.id;
        customer2Token = signToken({ userId: customer2Id, email: customer2.email, role: customer2.role });

        // Create Merchant
        const merchant = await prisma.user.create({
            data: {
                email: `merch-order-${Date.now()}@example.com`,
                firstName: 'Merch',
                lastName: 'Owner',
                passwordHash: 'dummyhash',
                role: Role.MERCHANT
            }
        });
        merchantId = merchant.id;
        merchantToken = signToken({ userId: merchantId, email: merchant.email, role: merchant.role });

        // Create Store
        const store = await prisma.store.create({
            data: {
                name: 'Order Test Store',
                slug: `order-test-store-${Date.now()}`,
                ownerId: merchantId,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 Order St',
                city: 'Leeds',
                postalCode: 'LS1 1UR',
                country: 'UK',
                latitude: 53.8008,
                longitude: -1.5491
            }
        });
        storeId = store.id;

        // Create Product
        const product = await prisma.product.create({
            data: {
                name: 'Order Test Banana',
                slug: `order-banana-${Date.now()}`,
                regularPrice: 0.99,
                storeId: storeId,
                stockQuantity: 100
            }
        });
        productId = product.id;

        // Create Addresses
        const addr1 = await prisma.address.create({
            data: {
                userId: customer1Id,
                streetAddress: '10 Cust Rd',
                city: 'Leeds',
                postalCode: 'LS1 1UR',
                country: 'UK',
                isDefault: true
            }
        });
        address1Id = addr1.id;

        const addr2 = await prisma.address.create({
            data: {
                userId: customer2Id,
                streetAddress: '20 Cust Rd',
                city: 'Leeds',
                postalCode: 'LS1 1UR',
                country: 'UK',
                isDefault: true
            }
        });
        address2Id = addr2.id;
    });

    afterAll(async () => {
        // Cleanup order status history, order items, reviews, order, address, cart, store, product, users
        await prisma.orderStatusHistory.deleteMany({}).catch(() => {});
        await prisma.orderItem.deleteMany({}).catch(() => {});
        await prisma.order.deleteMany({}).catch(() => {});
        await prisma.address.deleteMany({}).catch(() => {});
        await prisma.product.deleteMany({}).catch(() => {});
        await prisma.store.deleteMany({}).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [customer1Id, customer2Id, merchantId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('POST /api/orders (Create Order)', () => {
        it('should fail if cart is empty', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    deliveryAddressId: address1Id,
                    paymentMethod: 'CASH',
                    tipAmount: 1.50
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Cart is empty');
        });

        it('should fail if delivery address is invalid or owned by another user', async () => {
            let cart = await prisma.cart.findUnique({
                where: { userId: customer1Id }
            });
            if (!cart) {
                cart = await prisma.cart.create({
                    data: { userId: customer1Id }
                });
            }
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    storeId,
                    quantity: 2
                }
            });

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    deliveryAddressId: address2Id, // Owned by Customer 2
                    paymentMethod: 'CASH',
                    tipAmount: 1.50
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid delivery address');
        });

        it('should place an order successfully with valid cart and address', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${customer1Token}`)
                .send({
                    deliveryAddressId: address1Id,
                    paymentMethod: 'CARD',
                    tipAmount: 2.00,
                    deliveryInstructions: 'Leave at front desk'
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toContain('Orders created successfully');
            expect(res.body.orders.length).toBeGreaterThan(0);

            orderId = res.body.orders[0].id;
            orderOTP = res.body.orders[0].deliveryOTP;
            expect(orderId).toBeDefined();
            expect(orderOTP).toBeDefined();
        });
    });

    describe('GET /api/orders (Get Customer Orders)', () => {
        it('should retrieve customer orders list', async () => {
            const res = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${customer1Token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.find((o: any) => o.id === orderId)).toBeDefined();
        });
    });

    describe('PUT /api/orders/:id/cancel (Cancel Order)', () => {
        it('should fail to cancel non-existent order', async () => {
            const res = await request(app)
                .put('/api/orders/00000000-0000-0000-0000-000000000000/cancel')
                .set('Authorization', `Bearer ${customer1Token}`);
            expect(res.status).toBe(404);
        });

        it('should block unauthorized user from cancelling order', async () => {
            const res = await request(app)
                .put(`/api/orders/${orderId}/cancel`)
                .set('Authorization', `Bearer ${customer2Token}`);
            expect(res.status).toBe(403);
        });

        it('should block cancellation if order is in non-cancellable state', async () => {
            // Update status to READY (not PENDING or CONFIRMED)
            await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.READY }
            });

            const res = await request(app)
                .put(`/api/orders/${orderId}/cancel`)
                .set('Authorization', `Bearer ${customer1Token}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Order cannot be cancelled');
        });

        it('should cancel order successfully if in PENDING state', async () => {
            // Restore status to PENDING
            await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.PENDING }
            });

            const res = await request(app)
                .put(`/api/orders/${orderId}/cancel`)
                .set('Authorization', `Bearer ${customer1Token}`);
            
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('cancelled successfully');
            expect(res.body.order.status).toBe('CANCELLED');
        });
    });

    describe('POST /api/orders/:id/verify-otp (Verify Order OTP)', () => {
        beforeEach(async () => {
            // Restore order to a pending status and verify state
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.OUT_FOR_DELIVERY,
                    isOTPVerified: false
                }
            });
        });

        it('should fail if OTP parameter is missing', async () => {
            const res = await request(app)
                .post(`/api/orders/${orderId}/verify-otp`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it('should block non-driver, non-owner users from verifying OTP', async () => {
            const res = await request(app)
                .post(`/api/orders/${orderId}/verify-otp`)
                .set('Authorization', `Bearer ${customer2Token}`)
                .send({ otp: orderOTP });
            expect(res.status).toBe(403);
        });

        it('should fail if OTP does not match', async () => {
            const res = await request(app)
                .post(`/api/orders/${orderId}/verify-otp`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ otp: '0000' });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid OTP');
        });

        it('should verify OTP successfully and mark order delivered', async () => {
            const res = await request(app)
                .post(`/api/orders/${orderId}/verify-otp`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ otp: orderOTP });
            
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('OTP verified and order delivered');
            expect(res.body.order.isOTPVerified).toBe(true);
            expect(res.body.order.status).toBe('DELIVERED');
        });

        it('should fail if OTP is already verified', async () => {
            await prisma.order.update({
                where: { id: orderId },
                data: { isOTPVerified: true }
            });

            const res = await request(app)
                .post(`/api/orders/${orderId}/verify-otp`)
                .set('Authorization', `Bearer ${merchantToken}`)
                .send({ otp: orderOTP });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already verified');
        });
    });

    describe('autoCancelOrders Utility', () => {
        it('should auto-cancel pending orders older than 10 minutes', async () => {
            // Create a pending order dated 15 minutes ago
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
            const staleOrder = await prisma.order.create({
                data: {
                    orderNumber: `GNSTALE-${Date.now()}`,
                    deliveryOTP: '9999',
                    userId: customer1Id,
                    storeId: storeId,
                    deliveryAddressId: address1Id,
                    subtotal: 10.00,
                    deliveryFee: 2.00,
                    taxAmount: 0.80,
                    totalAmount: 12.80,
                    status: OrderStatus.PENDING,
                    createdAt: fifteenMinsAgo
                }
            });

            await autoCancelOrders();

            const checkOrder = await prisma.order.findUnique({
                where: { id: staleOrder.id }
            });
            expect(checkOrder?.status).toBe(OrderStatus.CANCELLED);
            expect(checkOrder?.cancellationReason).toContain('Auto-cancelled');

            // Cleanup stale order
            await prisma.orderStatusHistory.deleteMany({ where: { orderId: staleOrder.id } }).catch(() => {});
            await prisma.order.delete({ where: { id: staleOrder.id } }).catch(() => {});
        });
    });
});
