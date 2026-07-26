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
import { signToken, signRefreshToken } from '../../utils/jwt.utils';
import { hashPassword } from '../../utils/password.utils';

describe('Logout & Token Revocation Security Unit Tests', () => {
    let testUserId: string;
    let testEmail: string;
    let validAccessToken: string;
    let validRefreshToken: string;

    beforeAll(async () => {
        testEmail = `logout-test-${Date.now()}@example.com`;
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: await hashPassword('Password123!'),
                firstName: 'Logout',
                lastName: 'Tester',
                emailVerified: true,
            }
        });
        testUserId = user.id;
    });

    afterAll(async () => {
        await (prisma as any).refreshToken.deleteMany({ where: { userId: testUserId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: testUserId } }).catch(() => {});
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Reset lastLogoutAt to ensure test access tokens are valid
        await prisma.user.update({
            where: { id: testUserId },
            data: { lastLogoutAt: null }
        });

        // Issue fresh tokens before each test step
        validAccessToken = signToken({ userId: testUserId, email: testEmail, role: 'CUSTOMER' });
        validRefreshToken = signRefreshToken({ userId: testUserId });

        await (prisma as any).refreshToken.create({
            data: {
                token: validRefreshToken,
                userId: testUserId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
    });

    it('1. POST /api/auth/logout successfully logs out user and returns 200', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${validAccessToken}`)
            .send({ refreshToken: validRefreshToken });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Logged out successfully');
    });

    it('2. Revokes refresh tokens in database upon logout', async () => {
        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${validAccessToken}`)
            .send({ refreshToken: validRefreshToken });

        const dbRefreshToken = await (prisma as any).refreshToken.findFirst({
            where: { token: validRefreshToken }
        });

        expect(dbRefreshToken?.revoked).toBe(true);
    });

    it('3. Prevents old access token from being reused after logout (HTTP 401 Revoked)', async () => {
        // Wait 1 sec to guarantee lastLogoutAt timestamp > token iat
        await new Promise(r => setTimeout(r, 1000));

        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${validAccessToken}`)
            .send({ refreshToken: validRefreshToken });

        // Attempt to access protected endpoint using old access token
        const protectedRes = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${validAccessToken}`);

        expect(protectedRes.status).toBe(401);
        expect(protectedRes.body.error).toContain('Token has been revoked');
    });

    it('4. Prevents revoked refresh token from issuing new access token', async () => {
        await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${validAccessToken}`)
            .send({ refreshToken: validRefreshToken });

        const refreshRes = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: validRefreshToken });

        expect(refreshRes.status).toBe(401);
        expect(refreshRes.body.error).toBeDefined();
    });
});
