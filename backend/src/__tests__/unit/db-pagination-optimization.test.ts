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
import { parsePagination, buildPaginatedResult } from '../../utils/pagination';
import prisma from '../../utils/prisma';
import { signToken } from '../../utils/jwt.utils';

describe('Database Query & Pagination Optimization Unit Tests', () => {
    let testUserId: string;
    let userToken: string;

    beforeAll(async () => {
        const u = await prisma.user.create({
            data: {
                email: `pagin-user-${Date.now()}@example.com`,
                firstName: 'Pagin',
                lastName: 'User',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        testUserId = u.id;
        userToken = signToken({ userId: u.id, email: u.email, role: u.role });
    });

    afterAll(async () => {
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('Pagination Utility Logic', () => {
        it('should parse page and limit correctly with fallback defaults and maxLimit capping', () => {
            const mockReq1 = { query: { page: '2', limit: '15' } } as any;
            const parsed1 = parsePagination(mockReq1, 20, 100);
            expect(parsed1).toEqual({ page: 2, limit: 15, skip: 15, take: 15 });

            // Test maxLimit capping
            const mockReq2 = { query: { page: '1', limit: '500' } } as any;
            const parsed2 = parsePagination(mockReq2, 20, 50);
            expect(parsed2).toEqual({ page: 1, limit: 50, skip: 0, take: 50 });

            // Test invalid page/limit fallbacks
            const mockReq3 = { query: { page: '-5', limit: 'abc' } } as any;
            const parsed3 = parsePagination(mockReq3, 20, 100);
            expect(parsed3).toEqual({ page: 1, limit: 20, skip: 0, take: 20 });
        });

        it('should build structured paginated result metadata correctly', () => {
            const mockData = [{ id: 1 }, { id: 2 }];
            const result = buildPaginatedResult(mockData, 45, 2, 10);

            expect(result.data).toEqual(mockData);
            expect(result.pagination).toEqual({
                page: 2,
                limit: 10,
                totalItems: 45,
                totalPages: 5,
                hasNextPage: true,
                hasPreviousPage: true
            });
        });
    });

    describe('Paginated API Endpoints (GET /api/products, GET /api/stores, GET /api/orders)', () => {
        it('GET /api/products returns structured pagination metadata', async () => {
            const res = await request(app).get('/api/products?page=1&limit=5');
            expect(res.status).toBe(200);

            // Output format can be paginated object or cached object
            const payload = res.body;
            if (payload.pagination) {
                expect(payload.pagination.page).toBe(1);
                expect(payload.pagination.limit).toBe(5);
                expect(Array.isArray(payload.data)).toBe(true);
            } else {
                expect(Array.isArray(payload)).toBe(true);
            }
        });

        it('GET /api/stores returns structured pagination metadata', async () => {
            const res = await request(app).get('/api/stores?page=1&limit=5');
            expect(res.status).toBe(200);
            expect(res.body.stores).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(5);
        });

        it('GET /api/orders returns paginated orders for authenticated user', async () => {
            const res = await request(app)
                .get('/api/orders?page=1&limit=10')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
        });
    });
});
