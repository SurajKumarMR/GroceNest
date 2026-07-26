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
import { emailService } from '../../services/email.service';
import { hashPassword } from '../../utils/password.utils';

describe('Password Reset Flow Security Unit Tests', () => {
    let unverifiedUserId: string;
    let verifiedUserId: string;
    let verifiedEmail: string;
    let unverifiedEmail: string;

    beforeAll(async () => {
        const timestamp = Date.now();
        
        // Unverified User
        unverifiedEmail = `reset-unverified-${timestamp}@example.com`;
        const unverifiedUser = await prisma.user.create({
            data: {
                email: unverifiedEmail,
                passwordHash: await hashPassword('Password123!'),
                firstName: 'Unverified',
                lastName: 'User',
                emailVerified: false,
            }
        });
        unverifiedUserId = unverifiedUser.id;

        // Verified User
        verifiedEmail = `reset-verified-${timestamp}@example.com`;
        const verifiedUser = await prisma.user.create({
            data: {
                email: verifiedEmail,
                passwordHash: await hashPassword('OldPassword123!'),
                firstName: 'Verified',
                lastName: 'User',
                emailVerified: true,
            }
        });
        verifiedUserId = verifiedUser.id;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { id: { in: [unverifiedUserId, verifiedUserId] } }
        }).catch(() => {});
        await prisma.$disconnect();
    });

    it('1. Rejects forgot-password if email is unverified', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: unverifiedEmail });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Email verification is required');
    });

    it('2. Generates 1-hour expiration reset token for verified user', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: verifiedEmail });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('If an account exists');

        const updatedUser = await prisma.user.findUnique({ where: { id: verifiedUserId } });
        expect(updatedUser?.passwordResetToken).toBeDefined();
        expect(updatedUser?.passwordResetExpires).toBeDefined();

        // Verify expiry is ~1 hour from now
        const diffMs = updatedUser!.passwordResetExpires!.getTime() - Date.now();
        expect(diffMs).toBeGreaterThan(3500000); // ~59 mins
        expect(diffMs).toBeLessThanOrEqual(3600000);

        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(verifiedEmail, updatedUser?.passwordResetToken);
    });

    it('3. Rejects reset-password with expired token', async () => {
        // Set expired token in database
        const expiredToken = `expired_token_${Date.now()}`;
        await prisma.user.update({
            where: { id: verifiedUserId },
            data: {
                passwordResetToken: expiredToken,
                passwordResetExpires: new Date(Date.now() - 60000) // 1 min ago
            }
        });

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token: expiredToken, newPassword: 'NewSecurePassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid or expired reset token');
    });

    it('4. Resets password, invalidates token (single-use), revokes sessions, and sends confirmation email', async () => {
        const validToken = `valid_token_${Date.now()}`;
        await prisma.user.update({
            where: { id: verifiedUserId },
            data: {
                passwordResetToken: validToken,
                passwordResetExpires: new Date(Date.now() + 1800000) // +30 mins
            }
        });

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token: validToken, newPassword: 'BrandNewSecurePassword123!' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Password has been reset successfully');

        // Verify single-use token consumption
        const updatedUser = await prisma.user.findUnique({ where: { id: verifiedUserId } });
        expect(updatedUser?.passwordResetToken).toBeNull();
        expect(updatedUser?.passwordResetExpires).toBeNull();
        expect(updatedUser?.lastLogoutAt).toBeDefined();

        // Verify single-use token cannot be re-used
        const reuseRes = await request(app)
            .post('/api/auth/reset-password')
            .send({ token: validToken, newPassword: 'AnotherPassword123!' });
        expect(reuseRes.status).toBe(400);

        expect(emailService.sendPasswordChangeConfirmation).toHaveBeenCalledWith(verifiedEmail);
    });
});
