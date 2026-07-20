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
import { notificationService } from '../../services/notification.service';

describe('Notification Service & Settings Integration Tests', () => {
    let testUserEmail = `notification-test-${Date.now()}@example.com`;
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        const res = await request(app)
             .post('/api/auth/register')
             .send({
                 email: testUserEmail,
                 password: 'GrocNest-Secure-Pass-2026!',
                 firstName: 'Notification',
                 lastName: 'Tester',
                 phone: `+447700900${Math.floor(100 + Math.random() * 900)}`
             });
        authToken = res.body.token;
        
        // Find user ID from the database
        const user = await prisma.user.findUnique({
            where: { email: testUserEmail }
        });
        userId = user!.id;
    });

    afterAll(async () => {
        await prisma.deviceToken.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.notificationLog.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.notificationPreference.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should register a device token', async () => {
        const res = await request(app)
            .post('/api/notifications/device-token')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                token: 'mock-fcm-token-12345',
                platform: 'ios'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const tokenRecord = await prisma.deviceToken.findUnique({
            where: { token: 'mock-fcm-token-12345' }
        });
        expect(tokenRecord).toBeTruthy();
        expect(tokenRecord!.userId).toBe(userId);
        expect(tokenRecord!.platform).toBe('ios');
    });

    it('should retrieve default notification preferences', async () => {
        const res = await request(app)
            .get('/api/notifications/preferences')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(true);
        expect(res.body.sms).toBe(true);
        expect(res.body.push).toBe(true);
    });

    it('should update notification preferences', async () => {
        const res = await request(app)
            .put('/api/notifications/preferences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                email: false,
                sms: true,
                push: false
            });

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(false);
        expect(res.body.sms).toBe(true);
        expect(res.body.push).toBe(false);

        const dbPrefs = await prisma.notificationPreference.findUnique({
            where: { userId }
        });
        expect(dbPrefs).toBeTruthy();
        expect(dbPrefs!.email).toBe(false);
        expect(dbPrefs!.sms).toBe(true);
        expect(dbPrefs!.push).toBe(false);
    });

    it('should send and log notifications based on preferences', async () => {
        // Clear logs first
        await prisma.notificationLog.deleteMany({ where: { userId } });

        // Dispatch a test notification
        await notificationService.createNotification({
            userId,
            type: 'system',
            title: 'Test Preferences',
            message: 'Checking preference filtering and logs'
        });

        // Since push and email are set to false, only SMS should be sent/logged
        const logs = await prisma.notificationLog.findMany({
            where: { userId }
        });

        expect(logs.length).toBe(1);
        expect(logs[0].type).toBe('sms');
        expect(logs[0].channel).toBe('twilio');
        expect(logs[0].status).toBe('sent');
    });

    it('should unregister a device token', async () => {
        const res = await request(app)
            .delete('/api/notifications/device-token/mock-fcm-token-12345')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const tokenRecord = await prisma.deviceToken.findUnique({
            where: { token: 'mock-fcm-token-12345' }
        });
        expect(tokenRecord).toBeNull();
    });
});
