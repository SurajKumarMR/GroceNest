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

describe('Notification Preference Controller Integration Tests', () => {
    let userId: string;
    let token: string;

    beforeAll(async () => {
        const user = await prisma.user.create({
            data: {
                email: `pref-test-${Date.now()}@example.com`,
                firstName: 'Pref',
                lastName: 'Tester',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER
            }
        });
        userId = user.id;
        token = signToken({ userId, email: user.email, role: user.role });
    });

    afterAll(async () => {
        await prisma.notificationPreference.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('GET /api/notifications/preferences', () => {
        it('should return 401 when unauthorized', async () => {
            const res = await request(app).get('/api/notifications/preferences');
            expect(res.status).toBe(401);
        });

        it('should retrieve or create default notification preferences', async () => {
            const res = await request(app)
                .get('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(true);
            expect(res.body.sms).toBe(true);
            expect(res.body.push).toBe(true);
            expect(res.body.emailEnabled).toBe(true);
            expect(res.body.smsEnabled).toBe(true);
            expect(res.body.pushEnabled).toBe(true);
        });
    });

    describe('PUT /api/notifications/preferences', () => {
        it('should return 401 when unauthorized', async () => {
            const res = await request(app)
                .put('/api/notifications/preferences')
                .send({ push: false });
            expect(res.status).toBe(401);
        });

        it('should update preferences using standard field names (push, sms, email)', async () => {
            const res = await request(app)
                .put('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: false,
                    sms: true,
                    push: false
                });

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(false);
            expect(res.body.sms).toBe(true);
            expect(res.body.push).toBe(false);
            expect(res.body.emailEnabled).toBe(false);

            const dbPrefs = await prisma.notificationPreference.findUnique({
                where: { userId }
            });
            expect(dbPrefs?.email).toBe(false);
            expect(dbPrefs?.sms).toBe(true);
            expect(dbPrefs?.push).toBe(false);
        });

        it('should update preferences using alias field names (pushEnabled, smsEnabled, emailEnabled)', async () => {
            const res = await request(app)
                .put('/api/notifications/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    emailEnabled: true,
                    smsEnabled: false,
                    pushEnabled: true
                });

            expect(res.status).toBe(200);
            expect(res.body.email).toBe(true);
            expect(res.body.sms).toBe(false);
            expect(res.body.push).toBe(true);
            expect(res.body.smsEnabled).toBe(false);

            const dbPrefs = await prisma.notificationPreference.findUnique({
                where: { userId }
            });
            expect(dbPrefs?.email).toBe(true);
            expect(dbPrefs?.sms).toBe(false);
            expect(dbPrefs?.push).toBe(true);
        });
    });
});
