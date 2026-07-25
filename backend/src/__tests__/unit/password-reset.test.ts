import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { hashPassword } from '../../utils/password.utils';

describe('Password Reset Flow Unit & Integration Tests', () => {
    let testUserId: string;
    const testEmail = `pwdreset_${Date.now()}@example.com`;
    const initialPassword = 'InitialPassword_2026!';
    const newPassword = 'NewSecurePassword_2026!';

    beforeAll(async () => {
        const hashedPassword = await hashPassword(initialPassword);
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: hashedPassword,
                firstName: 'Password',
                lastName: 'ResetTester',
                emailVerified: false, // Initially unverified
            },
        });
        testUserId = user.id;
    });

    afterAll(async () => {
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
        }
    });

    it('should reject password reset request if email is unverified', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testEmail });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Email verification is required');
    });

    it('should generate reset token with 1-hour expiration when email is verified', async () => {
        // Mark user as email verified
        await prisma.user.update({
            where: { id: testUserId },
            data: { emailVerified: true },
        });

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testEmail });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('If an account exists');

        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(user?.passwordResetToken).toBeDefined();
        expect(user?.passwordResetToken).not.toBeNull();

        // Expiration check (~1 hour in future)
        const expiresAt = user?.passwordResetExpires ? new Date(user.passwordResetExpires).getTime() : 0;
        const now = Date.now();
        const diffInMinutes = (expiresAt - now) / 60000;

        expect(diffInMinutes).toBeGreaterThan(55);
        expect(diffInMinutes).toBeLessThanOrEqual(60);
    });

    it('should reset password successfully and clear reset token (single-use)', async () => {
        const userBefore = await prisma.user.findUnique({ where: { id: testUserId } });
        const token = userBefore?.passwordResetToken;
        expect(token).toBeTruthy();

        const resetRes = await request(app)
            .post('/api/auth/reset-password')
            .send({
                token,
                newPassword,
            });

        expect(resetRes.status).toBe(200);
        expect(resetRes.body.message).toContain('reset successfully');

        // Confirm token is cleared (single-use enforcement)
        const userAfter = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(userAfter?.passwordResetToken).toBeNull();
        expect(userAfter?.passwordResetExpires).toBeNull();

        // Login with new password should succeed
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: newPassword });

        expect(loginRes.status).toBe(200);
    });

    it('should reject reuse of the same reset token (single-use test)', async () => {
        // Request a new token
        await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testEmail });

        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        const token = user?.passwordResetToken;

        // Use token first time
        const firstUseRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, newPassword: 'UniqueSecPass_98762!' });

        expect(firstUseRes.status).toBe(200);

        // Attempt second use with same token
        const secondUseRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, newPassword: 'AnotherUniquePass_54321!' });

        expect(secondUseRes.status).toBe(400);
        expect(secondUseRes.body.error).toContain('Invalid or expired reset token');
    });

    it('should reject expired reset token (>1 hour)', async () => {
        // Set expired token manually in DB
        const expiredToken = 'expired_test_token_12345';
        await prisma.user.update({
            where: { id: testUserId },
            data: {
                passwordResetToken: expiredToken,
                passwordResetExpires: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes in past
            },
        });

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token: expiredToken, newPassword: 'ThirdUniquePass_11223!' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid or expired reset token');
    });
});
