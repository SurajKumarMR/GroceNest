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

describe('Swagger Documentation Integration Tests', () => {
    it('should serve Swagger UI documentation at /api/docs/', async () => {
        // Express swagger-ui serves a redirect or index html on /api/docs/
        const res = await request(app).get('/api/docs/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('swagger');
        expect(res.text).toContain('html');
    });

    it('should redirect /api/docs to /api/docs/', async () => {
        const res = await request(app).get('/api/docs');
        expect([200, 301, 302]).toContain(res.status);
    });
});
