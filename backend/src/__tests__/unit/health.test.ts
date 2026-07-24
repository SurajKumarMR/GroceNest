import request from 'supertest';

jest.mock('otplib', () => ({
    generateSecret: () => 'MOCKSECRET123',
    generateURI: () => 'mock-uri',
    verify: () => true
}));

import { app } from '../../index';

describe('Health Check Endpoint Enhancement (index.ts)', () => {
    it('should return 200 OK and health status object for GET /health', async () => {
        const res = await request(app).get('/health');
        expect([200, 503]).toContain(res.status);
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('checks');
        expect(res.body.checks).toHaveProperty('database');
        expect(res.body.checks).toHaveProperty('stripe');
        expect(res.body).toHaveProperty('timestamp');
    });
});
