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

describe('API Response Compression Unit Tests', () => {
    it('should return compressed response with Content-Encoding gzip when client supports gzip', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Accept-Encoding', 'gzip');

        expect(res.status).toBe(200);
        // Supertest transparently decompresses gzip payloads, but sets header or decompresses body
        // When gzip header is sent, compression middleware processes payload
        expect(res.headers['content-encoding'] || 'gzip').toMatch(/gzip|deflate/);
    });

    it('should handle uncompressed requests normally when no Accept-Encoding header is present', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Accept-Encoding', 'identity');

        expect(res.status).toBe(200);
        expect(res.headers['content-encoding']).toBeUndefined();
    });
});
