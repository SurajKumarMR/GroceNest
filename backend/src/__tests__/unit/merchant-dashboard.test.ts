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

describe('Merchant Dashboard Endpoints Unit Tests', () => {
    let merchantUserId: string;
    let merchantToken: string;
    let storeId: string;
    let customerUserId: string;

    beforeAll(async () => {
        // Create Merchant User
        const merchant = await prisma.user.create({
            data: {
                email: `merchant-dash-${Date.now()}@example.com`,
                firstName: 'Merchant',
                lastName: 'Owner',
                passwordHash: 'dummyhash',
                role: 'MERCHANT',
            }
        });
        merchantUserId = merchant.id;
        merchantToken = signToken({ userId: merchant.id, email: merchant.email, role: merchant.role });

        // Create Customer User
        const customer = await prisma.user.create({
            data: {
                email: `customer-dash-${Date.now()}@example.com`,
                firstName: 'Customer',
                lastName: 'Buyer',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER',
            }
        });
        customerUserId = customer.id;

        // Create Merchant Store
        const store = await prisma.store.create({
            data: {
                name: 'Merchant Test Store',
                slug: `merchant-store-${Date.now()}`,
                ownerId: merchantUserId,
                streetAddress: '123 Market St',
                city: 'London',
                state: 'Greater London',
                postalCode: 'EC1A 1BB',
                country: 'UK',
                latitude: 51.5074,
                longitude: -0.1278,
                cuisineTypes: ['Grocery'],
            }
        });
        storeId = store.id;
    });

    afterAll(async () => {
        await prisma.review.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.order.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { storeId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [merchantUserId, customerUserId] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('GET /api/owner/my-store returns merchant store details', async () => {
        const res = await request(app)
            .get('/api/owner/my-store')
            .set('Authorization', `Bearer ${merchantToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(storeId);
        expect(res.body.name).toBe('Merchant Test Store');
    });

    it('GET /api/owner/analytics/revenue returns revenue metrics', async () => {
        const res = await request(app)
            .get('/api/owner/analytics/revenue?days=30')
            .set('Authorization', `Bearer ${merchantToken}`);

        expect(res.status).toBe(200);
        expect(res.body.totalGrossSales).toBeDefined();
        expect(res.body.totalNetPayout).toBeDefined();
    });

    it('POST /api/owner/payouts triggers manual merchant payout request', async () => {
        const res = await request(app)
            .post('/api/owner/payouts')
            .set('Authorization', `Bearer ${merchantToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
        expect(res.body.payout).toBeDefined();
    });

    it('GET /api/owner/reviews and POST /api/owner/reviews/:reviewId/response', async () => {
        // Create sample review
        const review = await prisma.review.create({
            data: {
                userId: customerUserId,
                storeId,
                rating: 5,
                reviewText: 'Great selection of organic fruits!',
            }
        });

        // Fetch store reviews
        const getRes = await request(app)
            .get('/api/owner/reviews')
            .set('Authorization', `Bearer ${merchantToken}`);

        expect(getRes.status).toBe(200);
        expect(Array.isArray(getRes.body)).toBe(true);
        expect(getRes.body.length).toBeGreaterThan(0);

        // Respond to review
        const respRes = await request(app)
            .post(`/api/owner/reviews/${review.id}/response`)
            .set('Authorization', `Bearer ${merchantToken}`)
            .send({ response: 'Thank you for your business!' });

        expect(respRes.status).toBe(200);
        expect(respRes.body.storeResponse).toBe('Thank you for your business!');
    });
});
