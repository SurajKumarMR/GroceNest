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
import { signToken } from '../../utils/jwt.utils';

describe('FCM Mobile Token Registration Unit Tests', () => {
    let userId: string;
    let userToken: string;
    const testFcmToken = 'fcm_test_token_mobile_12345';

    beforeAll(async () => {
        const u = await prisma.user.create({
            data: {
                email: `fcm-user-${Date.now()}@example.com`,
                firstName: 'FCM',
                lastName: 'Tester',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        userId = u.id;
        userToken = signToken({ userId, email: u.email, role: u.role });
    });

    afterAll(async () => {
        await prisma.deviceToken.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('POST /api/users/fcm-token', () => {
        it('should register FCM token successfully via /api/users/fcm-token', async () => {
            const res = await request(app)
                .post('/api/users/fcm-token')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    fcmToken: testFcmToken,
                    platform: 'android'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify record created in database
            const stored = await prisma.deviceToken.findUnique({ where: { token: testFcmToken } });
            expect(stored).toBeDefined();
            expect(stored?.userId).toBe(userId);
            expect(stored?.platform).toBe('android');
        });

        it('should return 400 when fcmToken is missing', async () => {
            const res = await request(app)
                .post('/api/users/fcm-token')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });

    describe('POST /api/notifications/device-token', () => {
        it('should register FCM token successfully via /api/notifications/device-token', async () => {
            const token2 = 'fcm_test_token_mobile_67890';
            const res = await request(app)
                .post('/api/notifications/device-token')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    token: token2,
                    platform: 'ios'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const stored = await prisma.deviceToken.findUnique({ where: { token: token2 } });
            expect(stored?.platform).toBe('ios');
        });
    });

    describe('DELETE /api/notifications/device-token/:token', () => {
        it('should unregister FCM token on logout', async () => {
            const res = await request(app)
                .delete(`/api/notifications/device-token/${testFcmToken}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);

            const stored = await prisma.deviceToken.findUnique({ where: { token: testFcmToken } });
            expect(stored).toBeNull();
        });
    });
});
