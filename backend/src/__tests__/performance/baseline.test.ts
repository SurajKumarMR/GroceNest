jest.mock('otplib', () => ({
    generateSecret: () => 'KVKFKRJTMR2HSKSK',
    verify: async () => true,
    generateURI: () => 'otpauth://totp/test',
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock',
}));
jest.mock('../../services/email.service', () => ({
    emailService: {
        sendEmail: jest.fn().mockResolvedValue(true),
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
        sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock('../../services/sms.service', () => ({
    smsService: {
        sendSMS: jest.fn().mockResolvedValue(true),
        sendVerificationOTP: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock('../../services/analytics.service', () => ({
    analyticsService: {
        trackSignup: jest.fn(),
        trackLogin: jest.fn(),
        trackEvent: jest.fn(),
    },
}));
jest.mock('../../utils/pwned.utils', () => ({
    isPasswordPwned: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../services/socket.service', () => ({
    initSocket: jest.fn(),
    getIO: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }),
}));

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { hashPassword } from '../../utils/password.utils';

describe('Single-User Baseline Latency Benchmark', () => {
    const ts = Date.now();
    let testUserId: string;
    let testEmail = `perf-base-${ts}@example.com`;
    let testPassword = 'PerfBaselinePassword123!';

    beforeAll(async () => {
        const hashedPassword = await hashPassword(testPassword);
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: hashedPassword,
                firstName: 'Baseline',
                lastName: 'User',
                role: 'CUSTOMER',
            },
        });
        testUserId = user.id;
    });

    afterAll(async () => {
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
        await prisma.$disconnect();
    });

    const measureLatency = async (fn: () => Promise<any>, iterations = 10) => {
        const durations: number[] = [];
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await fn();
            durations.push(Date.now() - start);
        }
        durations.sort((a, b) => a - b);
        const p50 = durations[Math.floor(durations.length * 0.5)];
        const p95 = durations[Math.floor(durations.length * 0.95)];
        return { p50, p95, durations };
    };

    it('GET /health p95 latency is < 200ms', async () => {
        const { p95 } = await measureLatency(async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
        }, 10);
        console.log(`[Baseline SLA] GET /health p95 = ${p95}ms (SLA < 200ms)`);
        expect(p95).toBeLessThan(200);
    });

    it('GET /api/products p95 latency is < 200ms', async () => {
        const { p95 } = await measureLatency(async () => {
            const res = await request(app).get('/api/products');
            expect(res.status).toBe(200);
        }, 10);
        console.log(`[Baseline SLA] GET /api/products p95 = ${p95}ms (SLA < 200ms)`);
        expect(p95).toBeLessThan(200);
    });

    it('GET /api/stores p95 latency is < 200ms', async () => {
        const { p95 } = await measureLatency(async () => {
            const res = await request(app).get('/api/stores');
            expect(res.status).toBe(200);
        }, 10);
        console.log(`[Baseline SLA] GET /api/stores p95 = ${p95}ms (SLA < 200ms)`);
        expect(p95).toBeLessThan(200);
    });

    it('POST /api/auth/login p95 latency is < 500ms', async () => {
        const { p95 } = await measureLatency(async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: testEmail,
                password: testPassword,
            });
            expect(res.status).toBe(200);
        }, 5);
        console.log(`[Baseline SLA] POST /api/auth/login p95 = ${p95}ms (SLA < 500ms)`);
        expect(p95).toBeLessThan(500);
    });
});
