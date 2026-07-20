
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

describe('API Integration Tests', () => {
    let testUserEmail = `test-${Date.now()}@example.com`;
    let authToken: string;
    let userId: string;

    afterAll(async () => {
        // Cleanup test data
        if (userId) {
            await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    describe('Auth Flow', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: testUserEmail,
                    password: 'GrocNest-Secure-Pass-2026!',
                    firstName: 'Integration',
                    lastName: 'Test',
                    phone: '+447000000001'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(testUserEmail);
            authToken = res.body.token;
            userId = res.body.user.id;
        });

        it('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'GrocNest-Secure-Pass-2026!'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            authToken = res.body.token;
        });

        it('should reject login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('User Profile', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(testUserEmail);
        });

        it('should update user profile', async () => {
            const res = await request(app)
                .put('/api/users/profile') // Corrected from PATCH
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'UpdatedName',
                    lastName: 'Test',
                    phone: '+447000000001'
                });

            expect(res.status).toBe(200);
            expect(res.body.firstName).toBe('UpdatedName');
        });
    });

    describe('Store & Order Flow Integration', () => {
        let storeId: string;
        let productId: string;
        let addressId: string;

        it('should create a test address', async () => {
            const res = await request(app)
                .post('/api/users/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    street: '10 High St',
                    city: 'Birmingham',
                    state: 'West Midlands',
                    zipCode: 'B1 1BB',
                    country: 'UK',
                    isDefault: true
                });

            expect(res.status).toBe(201);
            addressId = res.body.id;
        });

        it('should create a store for the test user', async () => {
            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Integration Test Store',
                    slug: `test-store-${Date.now()}`,
                    streetAddress: '123 Test St',
                    city: 'Birmingham',
                    postalCode: 'B10 1AA',
                    country: 'UK',
                    latitude: 52.4862,
                    longitude: -1.8904,
                    cuisineTypes: ['Caribbean']
                });

            expect(res.status).toBe(201);
            storeId = res.body.id;
        });

        it('should create a product in the store', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    storeId,
                    name: 'Test Plantain',
                    slug: `test-plantain-${Date.now()}`,
                    regularPrice: 2.50,
                    stockQuantity: 100,
                    status: 'active'
                });

            expect(res.status).toBe(201);
            productId = res.body.id;
        });

        it('should add the product to the cart', async () => {
            const res = await request(app)
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId,
                    quantity: 2
                });

            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(1);
        });

        it('should place an order from the cart', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    deliveryAddressId: addressId,
                    paymentMethod: 'CASH',
                    tipAmount: 1.00
                });

            expect(res.status).toBe(201);
            expect(res.body.orders[0].totalAmount).toBeGreaterThan(5);
        });
    });
});
