import request from 'supertest';

jest.mock('otplib', () => ({
    generateSecret: () => 'MOCKSECRET123',
    generateURI: () => 'mock-uri',
    verify: () => true
}));

import { app } from '../../index';

describe('Helmet CSP Hardening (index.ts)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('should set Content-Security-Policy header without unsafe-inline in production mode', async () => {
        process.env.NODE_ENV = 'production';
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);

        const cspHeader = res.headers['content-security-policy'];
        if (cspHeader) {
            expect(cspHeader).not.toContain("'unsafe-inline'");
            expect(cspHeader).toContain("script-src 'self' https://js.stripe.com https://maps.googleapis.com");
            expect(cspHeader).toContain("style-src 'self' https://fonts.googleapis.com");
            expect(cspHeader).toContain("object-src 'none'");
        }
    });

    it('should set strict security headers including HSTS and X-Content-Type-Options', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
});
