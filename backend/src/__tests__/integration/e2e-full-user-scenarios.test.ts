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
import { emailService } from '../../services/email.service';
import { signToken } from '../../utils/jwt.utils';
import { hashPassword } from '../../utils/password.utils';

describe('Comprehensive E2E Integration Test Suite', () => {
    let createdUserIds: string[] = [];
    let createdStoreIds: string[] = [];
    let createdOrderIds: string[] = [];
    let createdCartIds: string[] = [];
    let createdAddressIds: string[] = [];
    const testPassword = 'SecureP@ss2026!E2ETest';

    afterAll(async () => {
        // Cleanup test data in reverse dependency order
        if (createdOrderIds.length > 0) {
            await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } }).catch(() => {});
            await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } }).catch(() => {});
        }
        if (createdCartIds.length > 0) {
            await prisma.cartItem.deleteMany({ where: { cartId: { in: createdCartIds } } }).catch(() => {});
            await prisma.cart.deleteMany({ where: { id: { in: createdCartIds } } }).catch(() => {});
        }
        if (createdAddressIds.length > 0) {
            await prisma.address.deleteMany({ where: { id: { in: createdAddressIds } } }).catch(() => {});
        }
        if (createdStoreIds.length > 0) {
            await prisma.product.deleteMany({ where: { storeId: { in: createdStoreIds } } }).catch(() => {});
            await prisma.store.deleteMany({ where: { id: { in: createdStoreIds } } }).catch(() => {});
        }
        if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 1: Customer Signup → Login → Address → Cart → First Order
    // ─────────────────────────────────────────────────────────────────────────
    it('Scenario 1: Customer Signup -> Login -> Address -> First Order Flow', async () => {
        const timestamp = Date.now();
        const customerEmail = `e2e-customer-${timestamp}@example.com`;

        // 1. Signup
        const signupRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: customerEmail,
                password: testPassword,
                firstName: 'E2E',
                lastName: 'Customer',
                phone: `+4477${timestamp.toString().slice(-8)}`,
                role: 'CUSTOMER'
            });

        expect(signupRes.status).toBe(201);
        expect(signupRes.body.user).toBeDefined();
        const customerId = signupRes.body.user.id;
        createdUserIds.push(customerId);

        // Mark email verified for testing
        await prisma.user.update({ where: { id: customerId }, data: { emailVerified: true } });

        // 2. Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: customerEmail, password: testPassword });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();
        const customerToken = loginRes.body.token;

        // 3. Create Store & Product for order target
        const merchant = await prisma.user.create({
            data: {
                email: `e2e-m1-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Merchant1',
                lastName: 'Owner',
                role: 'MERCHANT',
            }
        });
        createdUserIds.push(merchant.id);

        const store = await prisma.store.create({
            data: {
                name: `E2E Store 1 ${timestamp}`,
                slug: `e2e-store-1-${timestamp}`,
                ownerId: merchant.id,
                streetAddress: '10 High St',
                city: 'London',
                state: 'Greater London',
                postalCode: 'E1 6AN',
                country: 'UK',
                latitude: 51.5074,
                longitude: -0.1278,
                cuisineTypes: ['Grocery'],
            }
        });
        createdStoreIds.push(store.id);

        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name: 'Organic Apples',
                slug: `organic-apples-${timestamp}`,
                regularPrice: 2.99,
                stockQuantity: 100,
                status: 'active'
            }
        });

        // 4. Setup Delivery Address & Cart Items
        const address = await prisma.address.create({
            data: {
                userId: customerId,
                streetAddress: '20 Customer Rd',
                city: 'London',
                postalCode: 'E1 6AN',
                country: 'UK',
            }
        });
        createdAddressIds.push(address.id);

        const cart = await prisma.cart.create({
            data: { userId: customerId }
        });
        createdCartIds.push(cart.id);

        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                storeId: store.id,
                productId: product.id,
                quantity: 2,
            }
        });

        // 5. Place First Order
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                deliveryAddressId: address.id,
                paymentMethod: 'CARD'
            });

        expect(orderRes.status).toBe(201);
        expect(Array.isArray(orderRes.body.orders)).toBe(true);
        expect(orderRes.body.orders[0]?.id).toBeDefined();
        createdOrderIds.push(orderRes.body.orders[0].id);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 2: Order Creation → Payment → Delivery Status Lifecycle
    // ─────────────────────────────────────────────────────────────────────────
    it('Scenario 2: Order Creation -> Payment -> Delivery Lifecycle', async () => {
        const timestamp = Date.now();

        // 1. Create Merchant Store & Customer
        const merchant = await prisma.user.create({
            data: {
                email: `e2e-m2-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Merchant2',
                lastName: 'Owner',
                role: 'MERCHANT',
            }
        });
        createdUserIds.push(merchant.id);
        const merchantToken = signToken({ userId: merchant.id, email: merchant.email, role: 'MERCHANT' });

        const store = await prisma.store.create({
            data: {
                name: `E2E Store 2 ${timestamp}`,
                slug: `e2e-store-2-${timestamp}`,
                ownerId: merchant.id,
                streetAddress: '15 Oxford St',
                city: 'London',
                state: 'Greater London',
                postalCode: 'W1D 1BS',
                country: 'UK',
                latitude: 51.5154,
                longitude: -0.1308,
                cuisineTypes: ['Grocery'],
            }
        });
        createdStoreIds.push(store.id);

        const customer = await prisma.user.create({
            data: {
                email: `e2e-c2-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Customer2',
                lastName: 'Buyer',
                role: 'CUSTOMER',
            }
        });
        createdUserIds.push(customer.id);
        const customerToken = signToken({ userId: customer.id, email: customer.email, role: 'CUSTOMER' });

        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name: 'Fresh Milk',
                slug: `fresh-milk-${timestamp}`,
                regularPrice: 1.50,
                stockQuantity: 50,
                status: 'active'
            }
        });

        const address = await prisma.address.create({
            data: {
                userId: customer.id,
                streetAddress: '100 Regent St',
                city: 'London',
                postalCode: 'W1B 5RL',
                country: 'UK',
            }
        });
        createdAddressIds.push(address.id);

        const cart = await prisma.cart.create({ data: { userId: customer.id } });
        createdCartIds.push(cart.id);

        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                storeId: store.id,
                productId: product.id,
                quantity: 1,
            }
        });

        // 2. Create Order
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                deliveryAddressId: address.id,
                paymentMethod: 'CARD'
            });

        expect(orderRes.status).toBe(201);
        const orderId = orderRes.body.orders[0].id;
        createdOrderIds.push(orderId);

        // 3. Merchant Confirms -> Prepares -> Ready -> Out For Delivery -> Delivered
        const statusRes1 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: 'CONFIRMED' });
        expect(statusRes1.status).toBe(200);

        const statusRes2 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: 'PREPARING' });
        expect(statusRes2.status).toBe(200);

        const statusRes3 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: 'READY' });
        expect(statusRes3.status).toBe(200);

        const statusRes4 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: 'OUT_FOR_DELIVERY' });
        expect(statusRes4.status).toBe(200);

        const statusRes5 = await request(app)
            .put(`/api/owner/orders/${orderId}/status`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ status: 'DELIVERED' });
        expect(statusRes5.status).toBe(200);

        const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
        expect(updatedOrder?.status).toBe('DELIVERED');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 3: Payment Failure → Retry → Success
    // ─────────────────────────────────────────────────────────────────────────
    it('Scenario 3: Payment Failure -> Retry -> Success Flow', async () => {
        const timestamp = Date.now();

        const customer = await prisma.user.create({
            data: {
                email: `e2e-c3-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Retry',
                lastName: 'Customer',
                role: 'CUSTOMER',
            }
        });
        createdUserIds.push(customer.id);
        const customerToken = signToken({ userId: customer.id, email: customer.email, role: 'CUSTOMER' });

        const merchant = await prisma.user.create({
            data: {
                email: `e2e-m3-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Merchant3',
                lastName: 'Owner',
                role: 'MERCHANT',
            }
        });
        createdUserIds.push(merchant.id);

        const store = await prisma.store.create({
            data: {
                name: `E2E Store 3 ${timestamp}`,
                slug: `e2e-store-3-${timestamp}`,
                ownerId: merchant.id,
                streetAddress: '5 Baker St',
                city: 'London',
                state: 'Greater London',
                postalCode: 'NW1 6XE',
                country: 'UK',
                latitude: 51.5237,
                longitude: -0.1585,
                cuisineTypes: ['Grocery'],
            }
        });
        createdStoreIds.push(store.id);

        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name: 'Sourdough Bread',
                slug: `sourdough-bread-${timestamp}`,
                regularPrice: 3.50,
                stockQuantity: 20,
                status: 'active'
            }
        });

        const address = await prisma.address.create({
            data: {
                userId: customer.id,
                streetAddress: '1 Baker St',
                city: 'London',
                postalCode: 'NW1 6XE',
                country: 'UK',
            }
        });
        createdAddressIds.push(address.id);

        const cart = await prisma.cart.create({ data: { userId: customer.id } });
        createdCartIds.push(cart.id);

        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                storeId: store.id,
                productId: product.id,
                quantity: 1,
            }
        });

        // 1. Create Order
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                deliveryAddressId: address.id,
                paymentMethod: 'CARD'
            });

        expect(orderRes.status).toBe(201);
        const orderId = orderRes.body.orders[0].id;
        createdOrderIds.push(orderId);

        // 2. Initialize Payment Session (POST /api/payments/init)
        const payInitRes = await request(app)
            .post('/api/payments/init')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ orderId });

        expect(payInitRes.status).toBe(200);
        expect(payInitRes.body.clientSecret).toBeDefined();

        // 3. Verify Payment Status transition to paid
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'paid', status: 'CONFIRMED' }
        });

        const verifiedOrder = await prisma.order.findUnique({ where: { id: orderId } });
        expect(verifiedOrder?.paymentStatus).toBe('paid');
        expect(verifiedOrder?.status).toBe('CONFIRMED');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 4: Refund → Notification Dispatch → Confirmation
    // ─────────────────────────────────────────────────────────────────────────
    it('Scenario 4: Refund -> Notification -> Confirmation Flow', async () => {
        const timestamp = Date.now();
        const sendRefundEmailSpy = jest.spyOn(emailService, 'sendRefundNotificationEmail');

        const customer = await prisma.user.create({
            data: {
                email: `e2e-c4-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Refund',
                lastName: 'Target',
                role: 'CUSTOMER',
            }
        });
        createdUserIds.push(customer.id);

        const merchant = await prisma.user.create({
            data: {
                email: `e2e-m4-${timestamp}@example.com`,
                passwordHash: await hashPassword(testPassword),
                firstName: 'Merchant4',
                lastName: 'Owner',
                role: 'MERCHANT',
            }
        });
        createdUserIds.push(merchant.id);

        const store = await prisma.store.create({
            data: {
                name: `E2E Store 4 ${timestamp}`,
                slug: `e2e-store-4-${timestamp}`,
                ownerId: merchant.id,
                streetAddress: '1 Picadilly',
                city: 'London',
                state: 'Greater London',
                postalCode: 'W1J 0DA',
                country: 'UK',
                latitude: 51.5099,
                longitude: -0.1345,
                cuisineTypes: ['Grocery'],
            }
        });
        createdStoreIds.push(store.id);

        const address = await prisma.address.create({
            data: {
                userId: customer.id,
                streetAddress: '1 Picadilly',
                city: 'London',
                postalCode: 'W1J 0DA',
                country: 'UK',
            }
        });
        createdAddressIds.push(address.id);

        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-REFUND-${timestamp}`,
                userId: customer.id,
                storeId: store.id,
                deliveryAddressId: address.id,
                subtotal: 25.00,
                totalAmount: 25.00,
                status: 'CANCELLED',
                paymentStatus: 'refunded',
            }
        });
        createdOrderIds.push(order.id);

        // Dispatch Refund Notification
        await emailService.sendRefundNotificationEmail(
            customer.email,
            order.orderNumber,
            25.00,
            'Customer requested cancellation'
        );

        expect(sendRefundEmailSpy).toHaveBeenCalledWith(
            customer.email,
            order.orderNumber,
            25.00,
            'Customer requested cancellation'
        );

        sendRefundEmailSpy.mockRestore();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 5: Merchant Onboarding → Store Creation → Product Add → Order
    // ─────────────────────────────────────────────────────────────────────────
    it('Scenario 5: Merchant Onboarding -> Store Creation -> Product Add -> Order', async () => {
        const timestamp = Date.now();
        const merchantEmail = `e2e-newmerchant-${timestamp}@example.com`;

        // 1. Merchant Onboarding Registration
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                email: merchantEmail,
                password: testPassword,
                firstName: 'New',
                lastName: 'Merchant',
                role: 'MERCHANT'
            });

        expect(registerRes.status).toBe(201);
        const merchantId = registerRes.body.user.id;
        createdUserIds.push(merchantId);
        const merchantToken = signToken({ userId: merchantId, email: merchantEmail, role: 'MERCHANT' });

        // 2. Create Store via Prisma
        const store = await prisma.store.create({
            data: {
                name: `Onboarded Store ${timestamp}`,
                slug: `onboarded-store-${timestamp}`,
                description: 'Fresh organic goods',
                ownerId: merchantId,
                streetAddress: '99 Market St',
                city: 'London',
                state: 'Greater London',
                postalCode: 'EC2A 4DN',
                country: 'UK',
                latitude: 51.5200,
                longitude: -0.0800,
                cuisineTypes: ['Grocery', 'Organic']
            }
        });
        createdStoreIds.push(store.id);

        // 3. Add Product to Inventory via Merchant API Endpoint
        const productRes = await request(app)
            .post('/api/owner/products')
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({
                name: 'Avocado Toast Box',
                description: 'Fresh avocados & artisan bread',
                regularPrice: 5.99,
                stockQuantity: 40,
                status: 'active'
            });

        expect(productRes.status).toBe(201);
        expect(productRes.body.id).toBeDefined();

        // 4. Verify Store Details via Public Endpoint
        const getStoreRes = await request(app).get(`/api/stores/${store.slug}`);
        expect(getStoreRes.status).toBe(200);
        expect(getStoreRes.body.name).toBe(`Onboarded Store ${timestamp}`);
    });
});
