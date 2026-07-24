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

import supertest from 'supertest';
import { app } from '../../index';

describe('Swagger / OpenAPI API Documentation Integration Tests', () => {
    it('should serve Swagger UI at GET /api/docs/', async () => {
        const response = await supertest(app).get('/api/docs/');
        expect(response.status).toBe(200);
        expect(response.text).toContain('swagger-ui');
    });

    it('should serve valid OpenAPI 3.0 JSON specification at GET /api/docs.json', async () => {
        const response = await supertest(app).get('/api/docs.json');
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.openapi).toBe('3.0.0');
        expect(response.body.info.title).toBe('GroceNest API Specification');
        expect(response.body.components.securitySchemes.BearerAuth).toBeDefined();
        expect(response.body.paths).toBeDefined();
    });
});
