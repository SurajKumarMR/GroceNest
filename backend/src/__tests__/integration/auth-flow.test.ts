/**
 * Full Auth Flow Integration Test
 *
 * Tests the complete, chained authentication lifecycle against a real Postgres DB:
 * signup → login → MFA challenge → refresh → logout → refresh-token reuse detection triggers session wipe.
 *
 * These tests are deliberately sequential (each test depends on state from the previous).
 * They use supertest against the live Express app with a real DB connection.
 */

jest.mock('otplib', () => ({
    generateSecret: () => 'MOCKOTPSECRET12345',
    verify: async () => true,
    generateURI: () => 'otpauth://totp/GroceNest:flow-test@example.com?secret=MOCKOTPSECRET12345&issuer=GroceNest',
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock',
}));
jest.mock('../../services/email.service', () => ({
    emailService: {
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock('../../services/sms.service', () => ({
    smsService: {
        sendVerificationOTP: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock('../../services/analytics.service', () => ({
    analyticsService: {
        trackSignup: jest.fn(),
        trackLogin: jest.fn(),
    },
}));
jest.mock('../../utils/pwned.utils', () => ({
    isPasswordPwned: jest.fn().mockResolvedValue(false),
}));

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { signToken } from '../../utils/jwt.utils';

describe('Full Auth Flow Integration', () => {
    const ts = Date.now();
    const testEmail = `flow-${ts}@example.com`;
    const testPassword = 'FlowTest123!';

    // State shared across sequential tests
    let userId: string;
    let accessToken: string;
    let refreshToken1: string;
    let refreshToken2: string;

    beforeAll(async () => {
        // Clean up any leftover test users from prior runs
        await prisma.refreshToken.deleteMany({
            where: { user: { email: { startsWith: 'flow-' } } },
        });
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'flow-' } },
        });
    });

    afterAll(async () => {
        await prisma.refreshToken.deleteMany({
            where: { user: { email: { startsWith: 'flow-' } } },
        }).catch(() => {});
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'flow-' } },
        }).catch(() => {});
        await prisma.$disconnect();
    });

    // ─── Step 1: Sign up ──────────────────────────────────────────────────────

    describe('Step 1: Sign up', () => {
        it('creates a new user and returns tokens', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    firstName: 'Flow',
                    lastName: 'Test',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user.email).toBe(testEmail);

            userId = res.body.user.id;
            accessToken = res.body.token;
            refreshToken1 = res.body.refreshToken;
        });

        it('confirms user is persisted in DB with hashed password', async () => {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            expect(user).not.toBeNull();
            expect(user?.passwordHash).not.toBe(testPassword); // must be hashed
            expect(user?.passwordHash?.length).toBeGreaterThan(20);
        });

        it('confirms a refresh token record is stored in DB', async () => {
            const stored = await (prisma as any).refreshToken.findUnique({
                where: { token: refreshToken1 },
            });
            expect(stored).not.toBeNull();
            expect(stored.userId).toBe(userId);
            expect(stored.revoked).toBe(false);
        });
    });

    // ─── Step 2: Login ───────────────────────────────────────────────────────

    describe('Step 2: Login', () => {
        it('logs in with valid credentials and returns new tokens', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.id).toBe(userId);
        });

        it('rejects login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: 'WrongPassword99!' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
        });

        it('rejects login for non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: `nobody-${ts}@example.com`, password: testPassword });

            expect(res.status).toBe(401);
        });
    });

    // ─── Step 3: MFA Setup and Challenge ─────────────────────────────────────

    describe('Step 3: MFA Challenge', () => {
        let mfaToken: string;

        it('sets up MFA (returns secret and QR code)', async () => {
            const res = await request(app)
                .get('/api/auth/mfa/setup')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('secret');
            expect(res.body).toHaveProperty('qrCodeUrl');
        });

        it('enables MFA successfully', async () => {
            const res = await request(app)
                .post('/api/auth/mfa/enable')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ token: '123456' }); // mocked otplib always returns true

            expect(res.status).toBe(200);
            expect(res.body.message).toContain('enabled');
            expect(res.body).toHaveProperty('backupCodes');
        });

        it('login returns mfaRequired=true once MFA is enabled', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });

            expect(res.status).toBe(200);
            expect(res.body.mfaRequired).toBe(true);
            expect(res.body).toHaveProperty('mfaToken');

            mfaToken = res.body.mfaToken;
        });

        it('completes MFA login with valid OTP and returns full auth tokens', async () => {
            const res = await request(app)
                .post('/api/auth/mfa/verify')
                .send({ mfaToken, otpToken: '123456' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.id).toBe(userId);

            // Update shared access token from MFA-authenticated session
            // Note: verifyMFA only returns a short-lived access token; refresh token was already issued at login
            accessToken = res.body.token;
            // refreshToken1 remains from the register step — still valid for Step 4
        });

        it('rejects MFA login with an invalid mfaToken', async () => {
            const res = await request(app)
                .post('/api/auth/mfa/verify')
                .send({ mfaToken: 'invalid-mfa-token', otpToken: '123456' });

            expect(res.status).toBe(401);
        });

        // Disable MFA so subsequent tests are not blocked
        afterAll(async () => {
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFactorEnabled: false, twoFactorSecret: null },
            });
        });
    });

    // ─── Step 4: Token Refresh ────────────────────────────────────────────────

    describe('Step 4: Token Refresh', () => {
        it('refreshes successfully and rotates tokens', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: refreshToken1 });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');

            // Old token should now be revoked
            const oldRecord = await (prisma as any).refreshToken.findUnique({
                where: { token: refreshToken1 },
            });
            expect(oldRecord?.revoked).toBe(true);

            // Store the new refresh token for next step
            refreshToken2 = res.body.refreshToken;
        });

        it('rejects a missing refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({});

            expect(res.status).toBe(401);
        });

        it('rejects a structurally invalid (garbage) refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'not-a-real-token' });

            expect(res.status).toBe(401);
        });
    });

    // ─── Step 5: Refresh-Token Reuse Detection → Session Wipe ────────────────

    describe('Step 5: Refresh-Token Reuse Detection (Session Wipe)', () => {
        it('reusing the ALREADY-ROTATED token triggers 401 and wipes ALL user sessions', async () => {
            // refreshToken1 was already exchanged in Step 4 and marked revoked.
            // A second attempt to use it is a reuse attack.
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: refreshToken1 });

            // Must be rejected
            expect(res.status).toBe(401);

            // ALL refresh tokens for this user must now be revoked (session wipe)
            const allTokens = await (prisma as any).refreshToken.findMany({
                where: { userId },
            });
            const allRevoked = allTokens.every((t: any) => t.revoked === true);
            expect(allRevoked).toBe(true);
        });

        it('after session wipe, the new token (refreshToken2) is also unusable', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: refreshToken2 });

            // Session was wiped — no valid tokens remain
            expect(res.status).toBe(401);
        });
    });

    // ─── Step 6: Logout ───────────────────────────────────────────────────────

    describe('Step 6: Logout', () => {
        let freshRefreshToken: string;

        beforeAll(async () => {
            // Get a fresh token by re-registering a temporary user
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: `flow-logout-${ts}@example.com`,
                    password: testPassword,
                    firstName: 'Logout',
                    lastName: 'Test',
                });
            freshRefreshToken = res.body.refreshToken;
        });

        it('logs out successfully and marks refresh token as revoked', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .send({ refreshToken: freshRefreshToken });

            expect(res.status).toBe(200);

            const stored = await (prisma as any).refreshToken.findUnique({
                where: { token: freshRefreshToken },
            });
            expect(stored?.revoked).toBe(true);
        });

        it('after logout, attempting to refresh with the revoked token returns 401', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: freshRefreshToken });

            expect(res.status).toBe(401);
        });
    });
});
