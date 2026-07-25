import { SessionService } from '../../services/session.service';
import prisma from '../../utils/prisma';
import { hashPassword } from '../../utils/password.utils';

describe('SessionService', () => {
    describe('parseDeviceType', () => {
        it('should correctly parse mobile User-Agent', () => {
            const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
            expect(SessionService.parseDeviceType(ua)).toBe('mobile');
        });

        it('should correctly parse tablet User-Agent', () => {
            const ua = 'Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
            expect(SessionService.parseDeviceType(ua)).toBe('tablet');
        });

        it('should correctly parse desktop User-Agent', () => {
            const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36';
            expect(SessionService.parseDeviceType(ua)).toBe('desktop');
        });

        it('should return unknown when User-Agent is empty or unrecognized', () => {
            expect(SessionService.parseDeviceType(undefined)).toBe('unknown');
            expect(SessionService.parseDeviceType('')).toBe('unknown');
            expect(SessionService.parseDeviceType('CustomBot/1.0')).toBe('unknown');
        });
    });

    describe('detectSuspiciousActivity', () => {
        let testUserId: string;

        beforeAll(async () => {
            const pwdHash = await hashPassword('Password123!');
            const user = await prisma.user.create({
                data: {
                    email: `suspicious_${Date.now()}@example.com`,
                    passwordHash: pwdHash,
                    firstName: 'Suspicious',
                    lastName: 'Tester',
                },
            });
            testUserId = user.id;
        });

        afterAll(async () => {
            if (testUserId) {
                await prisma.userSession.deleteMany({ where: { userId: testUserId } }).catch(() => {});
                await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
            }
        });

        afterEach(async () => {
            await prisma.userSession.deleteMany({
                where: { userId: testUserId },
            });
        });

        it('should not flag normal single session as suspicious', async () => {
            const result = await SessionService.detectSuspiciousActivity(testUserId, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0)');
            expect(result.isSuspicious).toBe(false);
            expect(result.suspiciousReason).toBeNull();
        });

        it('should flag suspicious if active session count reaches 5 or more', async () => {
            for (let i = 0; i < 5; i++) {
                await prisma.userSession.create({
                    data: {
                        userId: testUserId,
                        ipAddress: `192.168.1.${i + 1}`,
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
                        deviceType: 'desktop',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            }

            const result = await SessionService.detectSuspiciousActivity(testUserId, '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0)');
            expect(result.isSuspicious).toBe(true);
            expect(result.suspiciousReason).toContain('Unusually high number of active sessions');
        });

        it('should flag rapid IP subnet change as suspicious', async () => {
            await prisma.userSession.create({
                data: {
                    userId: testUserId,
                    ipAddress: '10.0.0.1',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
                    deviceType: 'desktop',
                    lastActiveAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            const result = await SessionService.detectSuspiciousActivity(testUserId, '185.220.101.5', 'Mozilla/5.0 (Windows NT 10.0)');
            expect(result.isSuspicious).toBe(true);
            expect(result.suspiciousReason).toContain('Rapid IP location change detected');
        });

        it('should flag rapid device type change as suspicious', async () => {
            await prisma.userSession.create({
                data: {
                    userId: testUserId,
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
                    deviceType: 'mobile',
                    lastActiveAt: new Date(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            const result = await SessionService.detectSuspiciousActivity(testUserId, '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
            expect(result.isSuspicious).toBe(true);
            expect(result.suspiciousReason).toContain('Device type changed rapidly');
        });
    });

    describe('Database Session Operations', () => {
        let testUserId: string;

        beforeAll(async () => {
            const pwdHash = await hashPassword('Password123!');
            const user = await prisma.user.create({
                data: {
                    email: `sessiontest_${Date.now()}@example.com`,
                    passwordHash: pwdHash,
                    firstName: 'Session',
                    lastName: 'Tester',
                },
            });
            testUserId = user.id;
        });

        afterAll(async () => {
            if (testUserId) {
                await prisma.userSession.deleteMany({ where: { userId: testUserId } }).catch(() => {});
                await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
            }
        });

        it('should create and retrieve a user session', async () => {
            const session = await SessionService.createSession({
                userId: testUserId,
                refreshToken: `mock-refresh-token-${Date.now()}`,
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            });

            expect(session.id).toBeDefined();
            expect(session.deviceType).toBe('desktop');
            expect(session.isActive).toBe(true);

            const activeSessions = await SessionService.getUserActiveSessions(testUserId);
            expect(activeSessions.length).toBeGreaterThanOrEqual(1);
            const found = activeSessions.find(s => s.id === session.id);
            expect(found).toBeDefined();
        });

        it('should revoke a specific user session', async () => {
            const session = await SessionService.createSession({
                userId: testUserId,
                refreshToken: `mock-refresh-revoke-${Date.now()}`,
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (iPhone)',
            });

            const revoked = await SessionService.revokeSession(session.id, testUserId);
            expect(revoked).toBe(true);

            const activeSessions = await SessionService.getUserActiveSessions(testUserId);
            const found = activeSessions.find(s => s.id === session.id);
            expect(found).toBeUndefined();
        });

        it('should revoke all other sessions except current', async () => {
            const currentSession = await SessionService.createSession({
                userId: testUserId,
                refreshToken: `current-token-${Date.now()}`,
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Macintosh)',
            });

            const otherSession = await SessionService.createSession({
                userId: testUserId,
                refreshToken: `other-token-${Date.now()}`,
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Android)',
            });

            const count = await SessionService.revokeAllOtherSessions(testUserId, currentSession.id);
            expect(count).toBeGreaterThanOrEqual(1);

            const activeSessions = await SessionService.getUserActiveSessions(testUserId);
            const foundOther = activeSessions.find(s => s.id === otherSession.id);
            const foundCurrent = activeSessions.find(s => s.id === currentSession.id);

            expect(foundOther).toBeUndefined();
            expect(foundCurrent).toBeDefined();
        });
    });
});
