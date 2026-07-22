jest.mock('otplib', () => ({
    generateSecret: () => 'KVKFKRJTMR2HSKSK',
    verify: async () => true,
    generateURI: () => 'otpauth://totp/GroceNest:test@example.com?secret=KVKFKRJTMR2HSKSK&issuer=GroceNest'
}));
jest.mock('qrcode', () => ({
    toDataURL: async () => 'data:image/png;base64,mock'
}));

import request from 'supertest';
import { app } from '../../index';
import prisma from '../../utils/prisma';
import { Role } from '@prisma/client';
import { signToken } from '../../utils/jwt.utils';

describe('Notification Controller Integration Tests', () => {
    let userId: string;
    let token: string;
    let notificationId: string;
    let deviceToken = 'test-fcm-token-123';

    beforeAll(async () => {
        // Create user
        const user = await prisma.user.create({
            data: {
                email: `notify-test-${Date.now()}@example.com`,
                firstName: 'Notify',
                lastName: 'User',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        userId = user.id;
        token = signToken({ userId, email: user.email, role: user.role });

        // Pre-populate a notification
        const notification = await prisma.notification.create({
            data: {
                userId,
                type: 'system',
                title: 'Welcome!',
                message: 'Welcome to GroceNest notifications.'
            }
        });
        notificationId = notification.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.notification.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.deviceToken.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.notificationPreference.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('GET /api/notifications', () => {
        it('should retrieve notifications for authenticated user', async () => {
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.find((n: any) => n.id === notificationId)).toBeDefined();
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.notification, 'findMany').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('should mark a notification as read', async () => {
            const res = await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const n = await prisma.notification.findUnique({ where: { id: notificationId } });
            expect(n?.isRead).toBe(true);
            expect(n?.readAt).toBeDefined();
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.notification, 'update').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('PATCH /api/notifications/mark-all-read', () => {
        it('should mark all unread notifications as read', async () => {
            // Create a new unread notification
            const unread = await prisma.notification.create({
                data: {
                    userId,
                    type: 'order',
                    title: 'New Order',
                    message: 'Your order was placed.'
                }
            });

            const res = await request(app)
                .patch('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const n = await prisma.notification.findUnique({ where: { id: unread.id } });
            expect(n?.isRead).toBe(true);
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.notification, 'updateMany').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .patch('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('POST /api/notifications/device-token', () => {
        it('should register a device token', async () => {
            const res = await request(app)
                .post('/api/notifications/device-token')
                .set('Authorization', `Bearer ${token}`)
                .send({ token: deviceToken, platform: 'ios' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const dt = await prisma.deviceToken.findUnique({ where: { token: deviceToken } });
            expect(dt).toBeDefined();
            expect(dt?.userId).toBe(userId);
            expect(dt?.platform).toBe('ios');
        });

        it('should fail if token is missing', async () => {
            const res = await request(app)
                .post('/api/notifications/device-token')
                .set('Authorization', `Bearer ${token}`)
                .send({ platform: 'android' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Token is required');
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.deviceToken, 'upsert').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .post('/api/notifications/device-token')
                .set('Authorization', `Bearer ${token}`)
                .send({ token: 'another-token', platform: 'web' });
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('DELETE /api/notifications/device-token/:token', () => {
        it('should unregister a device token', async () => {
            const res = await request(app)
                .delete(`/api/notifications/device-token/${deviceToken}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const dt = await prisma.deviceToken.findUnique({ where: { token: deviceToken } });
            expect(dt).toBeNull();
        });

        it('should fail to unregister if token is not provided in params', async () => {
            const res = await request(app)
                .delete('/api/notifications/device-token/')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(404); // Router handles missing param as 404
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.deviceToken, 'deleteMany').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .delete('/api/notifications/device-token/some-token-here')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('GET /api/notifications/preferences', () => {
        it('should retrieve or create default preferences', async () => {
            const res = await request(app)
                .get('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(true);
            expect(res.body.sms).toBe(true);
            expect(res.body.push).toBe(true);
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.notificationPreference, 'findUnique').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .get('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });

    describe('PUT /api/notifications/preferences', () => {
        it('should update preferences successfully', async () => {
            const res = await request(app)
                .put('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: false, push: false });

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(false);
            expect(res.body.sms).toBe(true); // unmodified
            expect(res.body.push).toBe(false);
        });

        it('should return 500 when database error occurs', async () => {
            const spy = jest.spyOn(prisma.notificationPreference, 'upsert').mockRejectedValueOnce(new Error('DB Error'));
            const res = await request(app)
                .put('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: true });
            expect(res.status).toBe(500);
            spy.mockRestore();
        });
    });
});
