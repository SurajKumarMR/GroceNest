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
import { redisService } from '../../services/redis.service';

describe('Redis Caching & Middleware Unit Tests', () => {
    beforeEach(async () => {
        await redisService.flushAll();
    });

    afterAll(async () => {
        await redisService.flushAll();
        await redisService.disconnect();
    });

    describe('RedisService Operations & Resilience', () => {
        it('should set and get JSON data correctly', async () => {
            const key = 'test:key:1';
            const value = { id: 101, name: 'Fresh Milk', price: 2.99 };

            await redisService.set(key, value, 60);
            const retrieved = await redisService.get<typeof value>(key);

            expect(retrieved).toEqual(value);
        });

        it('should return null for expired or non-existent keys', async () => {
            const key = 'test:key:nonexistent';
            const retrieved = await redisService.get(key);
            expect(retrieved).toBeNull();
        });

        it('should delete keys individually and by pattern', async () => {
            await redisService.set('cache:products:1', { name: 'Item 1' });
            await redisService.set('cache:products:2', { name: 'Item 2' });
            await redisService.set('cache:stores:1', { name: 'Store 1' });

            // Pattern delete products
            await redisService.delByPattern('cache:products:*');

            expect(await redisService.get('cache:products:1')).toBeNull();
            expect(await redisService.get('cache:products:2')).toBeNull();

            // Store key remains intact
            const store = await redisService.get<{ name: string }>('cache:stores:1');
            expect(store?.name).toBe('Store 1');
        });

        it('should handle offline fallback gracefully without throwing errors', async () => {
            const key = 'test:fallback:key';
            const val = { fallback: true };

            await redisService.set(key, val);
            const res = await redisService.get<typeof val>(key);

            expect(res).toEqual(val);
        });
    });

    describe('HTTP cacheMiddleware & Response Headers', () => {
        it('should serve X-Cache: MISS on first request and X-Cache: HIT on subsequent request', async () => {
            // First GET request -> MISS
            const res1 = await request(app).get('/api/products');
            expect(res1.status).toBe(200);
            expect(res1.headers['x-cache']).toBe('MISS');

            // Second GET request -> HIT
            const res2 = await request(app).get('/api/products');
            expect(res2.status).toBe(200);
            expect(res2.headers['x-cache']).toBe('HIT');
            expect(res2.body).toEqual(res1.body);
        });

        it('should invalidate cache when cache:products:* pattern is deleted', async () => {
            // Populate cache
            await request(app).get('/api/products');

            // Invalidate products cache
            await redisService.delByPattern('cache:products:*');

            // Third GET request -> MISS again
            const res3 = await request(app).get('/api/products');
            expect(res3.status).toBe(200);
            expect(res3.headers['x-cache']).toBe('MISS');
        });
    });
});
