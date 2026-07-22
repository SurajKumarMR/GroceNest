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

describe('Store and Product Controller Integration Tests', () => {
    let merchant1Id: string;
    let merchant1Token: string;
    
    let merchant2Id: string;
    let merchant2Token: string;

    let store1Id: string;
    let store1Slug: string;
    let store2Id: string;
    
    let categoryId: string;
    let productId: string;

    beforeAll(async () => {
        // Create Merchant 1
        const merchant1 = await prisma.user.create({
            data: {
                email: `merch1-prod-${Date.now()}@example.com`,
                firstName: 'Merchant',
                lastName: 'One',
                passwordHash: 'dummyhash',
                role: Role.MERCHANT
            }
        });
        merchant1Id = merchant1.id;
        merchant1Token = signToken({ userId: merchant1Id, email: merchant1.email, role: merchant1.role });

        // Create Merchant 2
        const merchant2 = await prisma.user.create({
            data: {
                email: `merch2-prod-${Date.now()}@example.com`,
                firstName: 'Merchant',
                lastName: 'Two',
                passwordHash: 'dummyhash',
                role: Role.MERCHANT
            }
        });
        merchant2Id = merchant2.id;
        merchant2Token = signToken({ userId: merchant2Id, email: merchant2.email, role: merchant2.role });

        // Create a Category for product testing
        const category = await prisma.category.create({
            data: {
                name: 'Organic Fruits',
                slug: `fruits-${Date.now()}`,
                isActive: true,
                displayOrder: 1
            }
        });
        categoryId = category.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.product.deleteMany({}).catch(() => {});
        await prisma.store.deleteMany({}).catch(() => {});
        await prisma.category.deleteMany({}).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [merchant1Id, merchant2Id] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('Store Controller', () => {
        it('should create a store successfully', async () => {
            store1Slug = `test-store-one-${Date.now()}`;
            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${merchant1Token}`)
                .send({
                    name: 'Test Store One',
                    slug: store1Slug,
                    streetAddress: '10 Store Rd',
                    city: 'Liverpool',
                    postalCode: 'L1 0AA',
                    country: 'UK',
                    latitude: 53.4084,
                    longitude: -2.9916,
                    cuisineTypes: ['Grocery', 'Bakery'],
                    description: 'A premium test grocery store.'
                });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Test Store One');
            store1Id = res.body.id;
            expect(store1Id).toBeDefined();
        });

        it('should fail to create a store if slug already exists', async () => {
            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${merchant2Token}`)
                .send({
                    name: 'Test Store Duplicate',
                    slug: store1Slug, // already exists
                    streetAddress: '20 Store Rd',
                    city: 'Liverpool',
                    postalCode: 'L1 0AA',
                    country: 'UK',
                    latitude: 53.4084,
                    longitude: -2.9916,
                    cuisineTypes: ['Grocery']
                });
            expect(res.status).toBe(409);
            expect(res.body.error).toContain('slug already exists');
        });

        it('should list stores with search and filters', async () => {
            // Get all stores
            const resAll = await request(app).get('/api/stores');
            expect(resAll.status).toBe(200);
            expect(resAll.body).toHaveProperty('stores');
            expect(resAll.body.stores.length).toBeGreaterThan(0);

            // Filter by query
            const resQuery = await request(app).get('/api/stores?q=premium');
            expect(resQuery.status).toBe(200);
            expect(resQuery.body.stores.find((s: any) => s.id === store1Id)).toBeDefined();

            // Filter by cuisine
            const resCuisine = await request(app).get('/api/stores?cuisine=Bakery');
            expect(resCuisine.status).toBe(200);
            expect(resCuisine.body.stores.find((s: any) => s.id === store1Id)).toBeDefined();
        });

        it('should get store by slug', async () => {
            const res = await request(app).get(`/api/stores/${store1Slug}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(store1Id);
        });

        it('should return 404 for non-existent store slug', async () => {
            const res = await request(app).get('/api/stores/non-existent-slug-123');
            expect(res.status).toBe(404);
        });

        it('should update store logo successfully', async () => {
            const res = await request(app)
                .post(`/api/stores/${store1Id}/logo`)
                .set('Authorization', `Bearer ${merchant1Token}`)
                .attach('logo', Buffer.from('mockfile'), 'logo.png');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('logoUrl');
        });

        it('should block non-owner from updating store logo', async () => {
            const res = await request(app)
                .post(`/api/stores/${store1Id}/logo`)
                .set('Authorization', `Bearer ${merchant2Token}`)
                .attach('logo', Buffer.from('mockfile'), 'logo.png');
            expect(res.status).toBe(403);
        });

        it('should update store cover photo successfully', async () => {
            const res = await request(app)
                .post(`/api/stores/${store1Id}/cover`)
                .set('Authorization', `Bearer ${merchant1Token}`)
                .attach('cover', Buffer.from('mockfile'), 'cover.png');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('coverPhotoUrl');
        });
    });

    describe('Product Controller', () => {
        it('should create product successfully', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${merchant1Token}`)
                .send({
                    storeId: store1Id,
                    name: 'Test Organic Apples',
                    slug: `organic-apples-${Date.now()}`,
                    regularPrice: 2.99,
                    stockQuantity: 80,
                    categoryId,
                    description: 'Very fresh and juicy apples.'
                });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Test Organic Apples');
            productId = res.body.id;
            expect(productId).toBeDefined();
        });

        it('should block creating product in another merchant\'s store', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${merchant2Token}`)
                .send({
                    storeId: store1Id, // Owned by Merchant 1
                    name: 'Stolen Apples',
                    slug: `stolen-apples-${Date.now()}`,
                    regularPrice: 1.50,
                    stockQuantity: 10
                });
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('not the owner');
        });

        it('should list products with filters', async () => {
            // General query
            const resAll = await request(app).get('/api/products');
            expect(resAll.status).toBe(200);
            expect(Array.isArray(resAll.body)).toBe(true);

            // Filter by search query
            const resSearch = await request(app).get(`/api/products?q=Organic Apples`);
            expect(resSearch.status).toBe(200);
            expect(resSearch.body.find((p: any) => p.id === productId)).toBeDefined();

            // Filter by storeId
            const resStore = await request(app).get(`/api/products?storeId=${store1Id}`);
            expect(resStore.status).toBe(200);
            expect(resStore.body.find((p: any) => p.id === productId)).toBeDefined();

            // Filter by category
            const resCategory = await request(app).get(`/api/products?category=${categoryId}`);
            expect(resCategory.status).toBe(200);
            expect(resCategory.body.find((p: any) => p.id === productId)).toBeDefined();

            // Filter by price range
            const resPrice = await request(app).get(`/api/products?minPrice=2.00&maxPrice=3.50`);
            expect(resPrice.status).toBe(200);
            expect(resPrice.body.find((p: any) => p.id === productId)).toBeDefined();
        });

        it('should retrieve all categories', async () => {
            const res = await request(app).get('/api/products/categories');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.find((c: any) => c.id === categoryId)).toBeDefined();
        });
    });
});
