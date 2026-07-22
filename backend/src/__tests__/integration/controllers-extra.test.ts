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
import { Role } from '@prisma/client';
import { signToken } from '../../utils/jwt.utils';

describe('Additional Controllers Integration Tests', () => {
    let adminId: string;
    let adminToken: string;
    
    let customerId: string;
    let customerToken: string;
    
    let merchantId: string;
    let merchantToken: string;
    
    let storeId: string;
    let productId: string;
    let addressId: string;
    let cartItemId: string;

    beforeAll(async () => {
        // 1. Create Admin User
        const admin = await prisma.user.create({
            data: {
                email: `admin-${Date.now()}@example.com`,
                firstName: 'System',
                lastName: 'Admin',
                passwordHash: 'dummyhash',
                role: Role.ADMIN
            }
        });
        adminId = admin.id;
        adminToken = signToken({ userId: adminId, email: admin.email, role: admin.role });

        // 2. Create Customer User
        const customer = await prisma.user.create({
            data: {
                email: `customer-${Date.now()}@example.com`,
                firstName: 'Normal',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customerId = customer.id;
        customerToken = signToken({ userId: customerId, email: customer.email, role: customer.role });

        // 3. Create Merchant User
        const merchant = await prisma.user.create({
            data: {
                email: `merchant-${Date.now()}@example.com`,
                firstName: 'Store',
                lastName: 'Owner',
                passwordHash: 'dummyhash',
                role: Role.MERCHANT
            }
        });
        merchantId = merchant.id;
        merchantToken = signToken({ userId: merchantId, email: merchant.email, role: merchant.role });

        // 4. Create Store
        const store = await prisma.store.create({
            data: {
                name: 'Extra Test Store',
                slug: `extra-test-store-${Date.now()}`,
                ownerId: merchantId,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 Extra St',
                city: 'Manchester',
                postalCode: 'M1 1AA',
                country: 'UK',
                latitude: 53.4808,
                longitude: -2.2426
            }
        });
        storeId = store.id;

        // 5. Create Product
        const product = await prisma.product.create({
            data: {
                name: 'Extra Test Apples',
                slug: `extra-apples-${Date.now()}`,
                regularPrice: 1.99,
                storeId: storeId,
                stockQuantity: 50
            }
        });
        productId = product.id;
    });

    afterAll(async () => {
        // Cleanup database
        await prisma.cartItem.deleteMany({ where: { cart: { userId: customerId } } }).catch(() => {});
        await prisma.cart.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.reviewImage.deleteMany({}).catch(() => {});
        await prisma.review.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await prisma.address.deleteMany({ where: { userId: customerId } }).catch(() => {});
        await (prisma as any).feedback?.deleteMany({}).catch(() => {});
        await (prisma as any).waitlist?.deleteMany({}).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [adminId, customerId, merchantId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('Admin Controller', () => {
        it('should block non-admins from stats, users, and stores list', async () => {
            const resStats = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resStats.status).toBe(403);

            const resUsers = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resUsers.status).toBe(403);
        });

        it('should get admin stats', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('stats');
            expect(res.body.stats).toHaveProperty('totalUsers');
            expect(res.body.stats).toHaveProperty('totalStores');
        });

        it('should get admin users list', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should get admin stores list', async () => {
            const res = await request(app)
                .get('/api/admin/stores')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should toggle user status', async () => {
            const res = await request(app)
                .patch(`/api/admin/users/${customerId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });
            expect(res.status).toBe(200);
            expect(res.body.isActive).toBe(false);

            // Re-enable
            await request(app)
                .patch(`/api/admin/users/${customerId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: true });
        });

        it('should fail toggle user status on bad input', async () => {
            const res = await request(app)
                .patch(`/api/admin/users/${customerId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: 'not-a-boolean' });
            expect(res.status).toBe(400);
        });

        it('should toggle store status', async () => {
            const res = await request(app)
                .patch(`/api/admin/stores/${storeId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });
            expect(res.status).toBe(200);
            expect(res.body.isActive).toBe(false);

            // Re-enable
            await request(app)
                .patch(`/api/admin/stores/${storeId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: true });
        });

        it('should fail toggle store status on bad input', async () => {
            const res = await request(app)
                .patch(`/api/admin/stores/${storeId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: 'not-a-boolean' });
            expect(res.status).toBe(400);
        });
    });

    describe('Support Controller', () => {
        it('should submit feedback successfully', async () => {
            const res = await request(app)
                .post('/api/support/feedback')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    type: 'bug',
                    category: 'ordering',
                    content: 'The checkout button was unresponsive.'
                });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('feedbackId');
        });

        it('should fail feedback submission if content is missing', async () => {
            const res = await request(app)
                .post('/api/support/feedback')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ type: 'bug' });
            expect(res.status).toBe(400);
        });

        it('should restrict getFeedbacks to admin users', async () => {
            const resCustomer = await request(app)
                .get('/api/support/feedback')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resCustomer.status).toBe(403);

            const resAdmin = await request(app)
                .get('/api/support/feedback')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(resAdmin.status).toBe(200);
            expect(Array.isArray(resAdmin.body)).toBe(true);
        });

        it('should retrieve chat history for customer', async () => {
            const res = await request(app)
                .get('/api/support/chat/history')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('Review Controller', () => {
        it('should submit review successfully', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    storeId,
                    productId,
                    rating: 5,
                    reviewText: 'Great product and quick service!',
                    images: ['https://example.com/image.png']
                });
            expect(res.status).toBe(201);
            expect(res.body.rating).toBe(5);
            expect(res.body.reviewText).toBe('Great product and quick service!');
        });

        it('should fail review submission with invalid rating', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    storeId,
                    productId,
                    rating: 6,
                    reviewText: 'Too high rating'
                });
            expect(res.status).toBe(400);
        });

        it('should get store reviews', async () => {
            const res = await request(app)
                .get(`/api/reviews/store/${storeId}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should get product reviews', async () => {
            const res = await request(app)
                .get(`/api/reviews/product/${productId}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('Marketing Controller', () => {
        const email = `waitlist-${Date.now()}@example.com`;

        it('should join waitlist successfully', async () => {
            const res = await request(app)
                .post('/api/marketing/waitlist')
                .send({
                    email,
                    name: 'Waitlist User',
                    source: 'referral'
                });
            expect(res.status).toBe(201);
            expect(res.body.message).toContain('Welcome');
        });

        it('should fail to join waitlist again with same email', async () => {
            const res = await request(app)
                .post('/api/marketing/waitlist')
                .send({ email });
            expect(res.status).toBe(400);
        });

        it('should restrict waitlist retrieval to admin users', async () => {
            const resCustomer = await request(app)
                .get('/api/marketing/waitlist')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resCustomer.status).toBe(403);

            const resAdmin = await request(app)
                .get('/api/marketing/waitlist')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(resAdmin.status).toBe(200);
            expect(Array.isArray(resAdmin.body)).toBe(true);
        });
    });

    describe('User Controller', () => {
        it('should get current profile', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(customerId);
            expect(res.body).not.toHaveProperty('passwordHash');
        });

        it('should update profile successfully', async () => {
            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    firstName: 'UpdatedName',
                    lastName: 'UpdatedLastName',
                    phone: '+447987654321',
                    dietaryPreferences: ['halal'],
                    cuisinePreferences: ['indian']
                });
            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe('UpdatedName');
            expect(res.body.lastName).toBe('UpdatedLastName');
            expect(res.body.phone).toBe('+447987654321');
        });

        it('should fail update profile on invalid schemas', async () => {
            const res = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    dietaryPreferences: 'vegan' // should be array
                });
            expect(res.status).toBe(400);
        });

        it('should update avatar successfully', async () => {
            const res = await request(app)
                .post('/api/users/profile/avatar')
                .set('Authorization', `Bearer ${customerToken}`)
                .attach('avatar', Buffer.from('mockfile'), 'avatar.png');
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('profilePhotoUrl');
        });

        it('should fail update avatar if no file uploaded', async () => {
            const res = await request(app)
                .post('/api/users/profile/avatar')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(400);
        });

        it('should manage user addresses', async () => {
            // 1. Create Address
            const resCreate = await request(app)
                .post('/api/users/addresses')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    street: '15 High St',
                    city: 'Manchester',
                    state: 'Greater Manchester',
                    zipCode: 'M1 1AA',
                    country: 'UK',
                    isDefault: true
                });
            expect(resCreate.status).toBe(201);
            addressId = resCreate.body.id;
            expect(addressId).toBeDefined();

            // 2. Get Addresses
            const resGet = await request(app)
                .get('/api/users/addresses')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resGet.status).toBe(200);
            expect(resGet.body.length).toBeGreaterThan(0);

            // 3. Delete Address
            const resDel = await request(app)
                .delete(`/api/users/addresses/${addressId}`)
                .set('Authorization', `Bearer ${customerToken}`);
            expect(resDel.status).toBe(204);
        });
    });

    describe('Cart Controller', () => {
        it('should get cart successfully', async () => {
            const res = await request(app)
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('items');
        });

        it('should add item to cart', async () => {
            const res = await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    productId,
                    quantity: 2
                });
            expect(res.status).toBe(200);
            expect(res.body.items.length).toBeGreaterThan(0);
            cartItemId = res.body.items[0].id;
        });

        it('should remove item from cart', async () => {
            const res = await request(app)
                .delete(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(204);
        });
    });
});
