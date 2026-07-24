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
import { Role } from '@prisma/client';
import { signToken } from '../../utils/jwt.utils';
import { notificationService } from '../../services/notification.service';

describe('Notification Delivery Tracking Integration Tests', () => {
    let adminId: string;
    let adminToken: string;
    let customerId: string;

    beforeAll(async () => {
        const admin = await prisma.user.create({
            data: {
                email: `admin-track-${Date.now()}@example.com`,
                firstName: 'Admin',
                lastName: 'Tracker',
                passwordHash: 'dummyhash',
                role: Role.ADMIN
            }
        });
        adminId = admin.id;
        adminToken = signToken({ userId: admin.id, email: admin.email, role: admin.role });

        const customer = await prisma.user.create({
            data: {
                email: `customer-track-${Date.now()}@example.com`,
                firstName: 'Customer',
                lastName: 'Tracker',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        customerId = customer.id;
    });

    afterAll(async () => {
        await prisma.notificationLog.deleteMany({
            where: { userId: { in: [adminId, customerId] } }
        }).catch(() => {});
        await prisma.user.deleteMany({
            where: { id: { in: [adminId, customerId] } }
        }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('Notification Delivery Status & Logging', () => {
        it('should create notification logs and update status to delivered', async () => {
            const log = await prisma.notificationLog.create({
                data: {
                    userId: customerId,
                    type: 'email',
                    channel: 'sendgrid',
                    title: 'Delivery Receipt',
                    body: 'Your receipt for order #1001',
                    status: 'sent'
                }
            });

            expect(log.status).toBe('sent');
            expect(log.deliveredAt).toBeNull();

            const updatedLog = await notificationService.markNotificationDelivered(log.id);

            expect(updatedLog.status).toBe('delivered');
            expect(updatedLog.deliveredAt).toBeDefined();
        });
    });

    describe('Delivery Statistics & High Failure Rate Alerting', () => {
        it('should calculate delivery rate and flag high failure rate when failure rate > 15%', async () => {
            // Clean logs for customerId
            await prisma.notificationLog.deleteMany({ where: { userId: customerId } });

            // Create 3 successful & 2 failed logs (failure rate = 40% > 15%)
            await prisma.notificationLog.createMany({
                data: [
                    { userId: customerId, type: 'push', channel: 'fcm', title: 'Test 1', body: 'Body 1', status: 'sent' },
                    { userId: customerId, type: 'push', channel: 'fcm', title: 'Test 2', body: 'Body 2', status: 'delivered' },
                    { userId: customerId, type: 'sms', channel: 'twilio', title: 'Test 3', body: 'Body 3', status: 'sent' },
                    { userId: customerId, type: 'sms', channel: 'twilio', title: 'Test 4', body: 'Body 4', status: 'failed', error: 'Invalid phone number format' },
                    { userId: customerId, type: 'email', channel: 'sendgrid', title: 'Test 5', body: 'Body 5', status: 'failed', error: 'Bounce back' },
                ]
            });

            const stats = await notificationService.getDeliveryStats(1);

            expect(stats.total).toBeGreaterThanOrEqual(5);
            expect(stats.failedCount).toBeGreaterThanOrEqual(2);
            expect(stats.highFailureRate).toBe(true);
            expect(stats.alertThresholdExceeded).toBe(true);
            expect(stats.channelStats.push).toBeDefined();
            expect(stats.recentFailures.length).toBeGreaterThan(0);
        });
    });

    describe('Admin API Endpoints', () => {
        it('GET /api/admin/notifications/stats should return analytics & alert status', async () => {
            const res = await request(app)
                .get('/api/admin/notifications/stats?days=1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.total).toBeDefined();
            expect(res.body.deliveryRate).toBeDefined();
            expect(res.body.failureRate).toBeDefined();
            expect(typeof res.body.highFailureRate).toBe('boolean');
            expect(res.body.channelStats).toBeDefined();
        });

        it('GET /api/admin/notifications/logs should return recent notification logs', async () => {
            const res = await request(app)
                .get('/api/admin/notifications/logs?limit=10')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });
});
