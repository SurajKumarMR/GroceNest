import request from 'supertest';

jest.mock('otplib', () => ({
    generateSecret: () => 'MOCKSECRET123',
    generateURI: () => 'mock-uri',
    verify: () => true
}));

import { app } from '../../index';

describe('CORS Configuration Hardening (index.ts)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('should allow requests with no Origin header (e.g. mobile apps)', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });

    it('should allow requests from whitelisted production domain https://grocenest.co.uk', async () => {
        process.env.NODE_ENV = 'production';
        const res = await request(app)
            .get('/health')
            .set('Origin', 'https://grocenest.co.uk');
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('https://grocenest.co.uk');
    });

    it('should allow requests from merchant whitelisted domain https://merchant.grocenest.co.uk', async () => {
        process.env.NODE_ENV = 'production';
        const res = await request(app)
            .get('/health')
            .set('Origin', 'https://merchant.grocenest.co.uk');
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('https://merchant.grocenest.co.uk');
    });

    it('should allow requests from admin whitelisted domain https://admin.grocenest.co.uk', async () => {
        process.env.NODE_ENV = 'production';
        const res = await request(app)
            .get('/health')
            .set('Origin', 'https://admin.grocenest.co.uk');
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('https://admin.grocenest.co.uk');
    });

    it('should reject requests from unapproved untrusted origin in production', async () => {
        process.env.NODE_ENV = 'production';
        const res = await request(app)
            .get('/health')
            .set('Origin', 'https://malicious-attacker.com');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});
