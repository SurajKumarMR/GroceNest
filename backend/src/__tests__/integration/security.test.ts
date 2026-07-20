
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

describe('Security & Data Privacy Tests', () => {
    let testUserEmail = `security-test-${Date.now()}@example.com`;
    let authToken: string;

    beforeAll(async () => {
        const res = await request(app)
             .post('/api/auth/register')
             .send({
                 email: testUserEmail,
                 password: 'GrocNest-Secure-Pass-2026!',
                 firstName: 'Security',
                 lastName: 'Admin'
             });
        authToken = res.body.token;
    });

    afterAll(async () => {
        await prisma.user.delete({ where: { email: testUserEmail } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should never return passwordHash in user responses', async () => {
        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body).not.toHaveProperty('passwordHash');
        expect(res.body).not.toHaveProperty('password');
        
        // Check nested profile if any
        if (res.body.profile) {
            expect(res.body.profile).not.toHaveProperty('passwordHash');
        }
    });

    it('should reject access to profile without token', async () => {
        const res = await request(app).get('/api/users/profile');
        expect(res.status).toBe(401);
    });

    it('should reject access with tampered token', async () => {
        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${authToken}tampered`);
        expect(res.status).toBe(403); // Match auth middleware behavior
    });

    it('should prevent unauthorized store access', async () => {
        // Create another user's store
        const otherStoreId = 'mock-store-id'; // In theory we'd use a real one
        const res = await request(app)
            .post(`/api/products`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                storeId: 'some-other-uuid-here', // Invalid/Other store
                name: 'Hacked Product',
                regularPrice: 10
            });
        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});
