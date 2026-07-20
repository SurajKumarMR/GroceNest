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
import { analyticsService } from '../../services/analytics.service';
import { signToken } from '../../utils/jwt.utils';

describe('Analytics & Business Metrics Integration Tests', () => {
    let customerEmail = `customer-analytics-${Date.now()}@example.com`;
    let adminEmail = `admin-analytics-${Date.now()}@example.com`;
    let customerToken: string;
    let adminToken: string;
    let customerId: string;
    let adminId: string;

    beforeAll(async () => {
        // Register standard customer
        const customerRes = await request(app)
             .post('/api/auth/register')
             .send({
                 email: customerEmail,
                 password: 'GrocNest-Secure-Pass-2026!',
                 firstName: 'Customer',
                 lastName: 'Analytics'
             });
        customerToken = customerRes.body.token;

        const customerUser = await prisma.user.findUnique({ where: { email: customerEmail } });
        customerId = customerUser!.id;

        // Register admin
        const adminRes = await request(app)
             .post('/api/auth/register')
             .send({
                 email: adminEmail,
                 password: 'GrocNest-Secure-Pass-2026!',
                 firstName: 'Admin',
                 lastName: 'Analytics'
             });
        adminToken = adminRes.body.token;

        // Update user to ADMIN in the DB
        const adminUser = await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'ADMIN' }
        });
        adminId = adminUser.id;
        
        // Generate a new token with the correct ADMIN role
        adminToken = signToken({ userId: adminId, email: adminEmail, role: 'ADMIN' });
    });

    afterAll(async () => {
        await prisma.analyticsEvent.deleteMany({
            where: { userId: { in: [customerId, adminId] } }
        }).catch(() => {});
        await prisma.user.delete({ where: { id: customerId } }).catch(() => {});
        await prisma.user.delete({ where: { id: adminId } }).catch(() => {});
        await prisma.$disconnect();
    });

    it('should reject analytics metrics access to unauthenticated requests', async () => {
        const res = await request(app).get('/api/analytics/metrics');
        expect(res.status).toBe(401);
    });

    it('should reject analytics metrics access to non-admin customers', async () => {
        const res = await request(app)
            .get('/api/analytics/metrics')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
    });

    it('should grant analytics metrics access to authenticated admins', async () => {
        const res = await request(app)
            .get('/api/analytics/metrics')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('summary');
        expect(res.body.summary).toHaveProperty('totalRevenue');
        expect(res.body.summary).toHaveProperty('orderVolume');
        expect(res.body.summary).toHaveProperty('averageOrderValue');
        expect(res.body).toHaveProperty('storePerformance');
        expect(res.body).toHaveProperty('recentEvents');
    });

    it('should correctly log events into the database via analyticsService', async () => {
        const testEventName = 'TEST_INTEGRATION_EVENT';
        
        // Track the event
        await analyticsService.trackEvent(testEventName, customerId, { testKey: 'testValue' });

        // Retrieve event from DB
        const dbEvents = await prisma.analyticsEvent.findMany({
            where: { userId: customerId, eventName: testEventName }
        });

        expect(dbEvents.length).toBe(1);
        expect(dbEvents[0].eventName).toBe(testEventName);
        expect(dbEvents[0].properties).toEqual({ testKey: 'testValue' });
    });

    it('should track customer registrations automatically', async () => {
        const dbEvents = await prisma.analyticsEvent.findMany({
            where: { userId: customerId, eventName: 'CUSTOMER_SIGNUP' }
        });
        expect(dbEvents.length).toBe(1);
    });
});
