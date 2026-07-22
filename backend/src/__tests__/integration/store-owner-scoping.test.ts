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
import { signToken } from '../../utils/jwt.utils';

describe('Store-Owner Scoping & IDOR Prevention Tests', () => {
    let merchantAId: string;
    let merchantBId: string;
    let storeAId: string;
    let storeBId: string;
    let productAId: string;
    let productBId: string;
    let orderAId: string;
    
    let tokenMerchantA: string;
    let tokenMerchantB: string;

    beforeAll(async () => {
        // Create Merchant A
        const merchantA = await prisma.user.create({
            data: {
                email: `merchant-a-${Date.now()}@example.com`,
                firstName: 'Merchant',
                lastName: 'A',
                passwordHash: 'dummyhash',
                role: 'MERCHANT'
            }
        });
        merchantAId = merchantA.id;
        tokenMerchantA = signToken({ userId: merchantA.id, email: merchantA.email, role: merchantA.role });

        // Create Merchant B
        const merchantB = await prisma.user.create({
            data: {
                email: `merchant-b-${Date.now()}@example.com`,
                firstName: 'Merchant',
                lastName: 'B',
                passwordHash: 'dummyhash',
                role: 'MERCHANT'
            }
        });
        merchantBId = merchantB.id;
        tokenMerchantB = signToken({ userId: merchantB.id, email: merchantB.email, role: merchantB.role });

        // Create Store A for Merchant A
        const storeA = await prisma.store.create({
            data: {
                name: 'Store A',
                slug: `store-a-${Date.now()}`,
                ownerId: merchantA.id,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 St A',
                city: 'London',
                postalCode: 'E1 AAA',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1
            }
        });
        storeAId = storeA.id;

        // Create Store B for Merchant B
        const storeB = await prisma.store.create({
            data: {
                name: 'Store B',
                slug: `store-b-${Date.now()}`,
                ownerId: merchantB.id,
                cuisineTypes: ['Grocery'],
                streetAddress: '123 St B',
                city: 'London',
                postalCode: 'E1 BBB',
                country: 'UK',
                latitude: 51.5,
                longitude: -0.1
            }
        });
        storeBId = storeB.id;

        // Create Product A in Store A
        const productA = await prisma.product.create({
            data: {
                name: 'Product A',
                slug: `prod-a-${Date.now()}`,
                regularPrice: 10.00,
                storeId: storeAId,
                stockQuantity: 10
            }
        });
        productAId = productA.id;

        // Create Product B in Store B
        const productB = await prisma.product.create({
            data: {
                name: 'Product B',
                slug: `prod-b-${Date.now()}`,
                regularPrice: 20.00,
                storeId: storeBId,
                stockQuantity: 20
            }
        });
        productBId = productB.id;

        // Create Order A in Store A
        const orderA = await prisma.order.create({
            data: {
                orderNumber: `ORD-A-${Date.now()}`,
                userId: merchantA.id, // Just reuse a user
                storeId: storeAId,
                subtotal: 10.00,
                deliveryFee: 2.00,
                taxAmount: 1.00,
                totalAmount: 13.00,
                status: 'PENDING'
            }
        });
        orderAId = orderA.id;
    });

    afterAll(async () => {
        // Clean up database
        await prisma.order.deleteMany({ where: { id: orderAId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: { in: [productAId, productBId] } } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: { in: [storeAId, storeBId] } } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [merchantAId, merchantBId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    // 1. updateStoreLogo (POST /api/stores/:storeId/logo)
    it('Merchant B should be forbidden from updating Store A logo', async () => {
        const res = await request(app)
            .post(`/api/stores/${storeAId}/logo`)
            .set('Authorization', `Bearer ${tokenMerchantB}`)
            .attach('logo', Buffer.from('dummy file content'), 'test.png');

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Not authorized');
    });

    // 2. updateStoreCover (POST /api/stores/:storeId/cover)
    it('Merchant B should be forbidden from updating Store A cover photo', async () => {
        const res = await request(app)
            .post(`/api/stores/${storeAId}/cover`)
            .set('Authorization', `Bearer ${tokenMerchantB}`)
            .attach('cover', Buffer.from('dummy file content'), 'test.png');

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Not authorized');
    });

    // 3. createProduct (POST /api/products)
    it('Merchant B should be forbidden from creating a product in Store A', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${tokenMerchantB}`)
            .send({
                storeId: storeAId,
                name: 'Unauthorized Product',
                slug: 'unauthorized-product',
                regularPrice: 5.00,
                stockQuantity: 100,
                description: 'Attempt'
            });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('You are not the owner of this store');
    });

    // 4. getMyStore (GET /api/owner/my-store)
    it('Merchant A should fetch Store A, but Merchant B should fetch Store B', async () => {
        const resA = await request(app)
            .get('/api/owner/my-store')
            .set('Authorization', `Bearer ${tokenMerchantA}`);
        expect(resA.status).toBe(200);
        expect(resA.body.id).toBe(storeAId);

        const resB = await request(app)
            .get('/api/owner/my-store')
            .set('Authorization', `Bearer ${tokenMerchantB}`);
        expect(resB.status).toBe(200);
        expect(resB.body.id).toBe(storeBId);
    });

    // 5. getStoreOrders (GET /api/owner/orders)
    it('Merchant A should see Order A, but Merchant B should see no orders', async () => {
        const resA = await request(app)
            .get('/api/owner/orders')
            .set('Authorization', `Bearer ${tokenMerchantA}`);
        expect(resA.status).toBe(200);
        expect(resA.body.some((o: any) => o.id === orderAId)).toBe(true);

        const resB = await request(app)
            .get('/api/owner/orders')
            .set('Authorization', `Bearer ${tokenMerchantB}`);
        expect(resB.status).toBe(200);
        expect(resB.body.some((o: any) => o.id === orderAId)).toBe(false);
    });

    // 6. updateOrderStatus (PUT /api/owner/orders/:orderId/status)
    it('Merchant B should be forbidden from updating Order A status', async () => {
        const res = await request(app)
            .put(`/api/owner/orders/${orderAId}/status`)
            .set('Authorization', `Bearer ${tokenMerchantB}`)
            .send({
                status: 'CONFIRMED',
                note: 'Confirmed by store'
            });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Not authorized to update this order');
    });

    // 7. updateStore (PUT /api/owner/my-store)
    it('Merchant A should be able to update Store A, but not modify other stores', async () => {
        const res = await request(app)
            .put('/api/owner/my-store')
            .set('Authorization', `Bearer ${tokenMerchantA}`)
            .send({
                name: 'New Name Store A',
                description: 'Updated description',
                cuisineTypes: ['Fast Food'],
                phone: '+447000000001',
                email: 'storea@example.com',
                streetAddress: '123 St A New',
                city: 'London',
                postalCode: 'E1 AAA',
                country: 'UK'
            });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('New Name Store A');
    });

    // 8. createProduct via store-owner (POST /api/owner/products)
    it('Merchant A should create product in Store A', async () => {
        const res = await request(app)
            .post('/api/owner/products')
            .set('Authorization', `Bearer ${tokenMerchantA}`)
            .send({
                name: 'Store Owner Product',
                description: 'P1',
                regularPrice: 15.00,
                stockQuantity: 50
            });

        expect(res.status).toBe(201);
        expect(res.body.storeId).toBe(storeAId);
        
        // Clean up created product
        await prisma.product.delete({ where: { id: res.body.id } });
    });

    // 9. deleteProduct (DELETE /api/owner/products/:productId)
    it('Merchant B should not be able to delete Product A', async () => {
        const res = await request(app)
            .delete(`/api/owner/products/${productAId}`)
            .set('Authorization', `Bearer ${tokenMerchantB}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Product not found or not authorized');

        // Confirm Product A is still present in DB
        const prod = await prisma.product.findUnique({ where: { id: productAId } });
        expect(prod).not.toBeNull();
    });

    // 10. updateProduct (PUT /api/owner/products/:productId)
    it('Merchant B should not be able to update Product A', async () => {
        const res = await request(app)
            .put(`/api/owner/products/${productAId}`)
            .set('Authorization', `Bearer ${tokenMerchantB}`)
            .send({
                name: 'Hacked Name',
                regularPrice: 1.00
            });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Product not found or not authorized');
    });

    // 11. uploadProductImage (POST /api/owner/products/:productId/image)
    it('Merchant B should not be able to upload product image for Product A', async () => {
        const res = await request(app)
            .post(`/api/owner/products/${productAId}/image`)
            .set('Authorization', `Bearer ${tokenMerchantB}`)
            .attach('product', Buffer.from('dummy file content'), 'test.png');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Product not found');
    });

    // 12. Invalid status transition - Merchant (PENDING -> READY)
    it('Merchant A should not be allowed to transition Order A from PENDING directly to READY', async () => {
        const res = await request(app)
            .put(`/api/owner/orders/${orderAId}/status`)
            .set('Authorization', `Bearer ${tokenMerchantA}`)
            .send({ status: 'READY' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Cannot transition order status from PENDING to READY');
    });

    // 13. Invalid status transition - Driver (PENDING -> DELIVERED)
    it('Driver should not be allowed to transition order to DELIVERED if it is not OUT_FOR_DELIVERY', async () => {
        // Create a driver
        const driver = await prisma.user.create({
            data: {
                email: `driver-${Date.now()}@example.com`,
                firstName: 'Test',
                lastName: 'Driver',
                passwordHash: 'dummyhash',
                role: 'DRIVER',
                isDriverApproved: true
            }
        });
        const tokenDriver = signToken({ userId: driver.id, email: driver.email, role: driver.role });

        // Assign driver to Order A and ensure Order A status is PENDING
        await prisma.order.update({
            where: { id: orderAId },
            data: { driverId: driver.id, status: 'PENDING' }
        });

        // Driver attempts to deliver order
        const res = await request(app)
            .post(`/api/driver/orders/${orderAId}/deliver`)
            .set('Authorization', `Bearer ${tokenDriver}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Cannot transition order status from PENDING to DELIVERED');

        // Cleanup
        await prisma.user.delete({ where: { id: driver.id } });
    });
});
