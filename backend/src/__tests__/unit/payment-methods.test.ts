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

describe('Payment Method Management Unit Tests', () => {
    let user1Id: string;
    let user2Id: string;
    let user1Token: string;
    let user2Token: string;
    let card1Id: string;
    let card2Id: string;

    beforeAll(async () => {
        const ts = Date.now();
        const u1 = await prisma.user.create({
            data: {
                email: `pm-user1-${ts}@example.com`,
                firstName: 'PM',
                lastName: 'User1',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        user1Id = u1.id;
        user1Token = signToken({ userId: user1Id, email: u1.email, role: u1.role });

        const u2 = await prisma.user.create({
            data: {
                email: `pm-user2-${ts}@example.com`,
                firstName: 'PM',
                lastName: 'User2',
                passwordHash: 'dummyhash',
                role: 'CUSTOMER'
            }
        });
        user2Id = u2.id;
        user2Token = signToken({ userId: user2Id, email: u2.email, role: u2.role });
    });

    afterAll(async () => {
        await prisma.paymentMethod.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('POST /api/payments/methods (Add Payment Method)', () => {
        it('should add first card and automatically set it as default', async () => {
            const res = await request(app)
                .post('/api/payments/methods')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    type: 'CARD',
                    stripePaymentMethodId: 'pm_mock_visa_123',
                    cardBrand: 'Visa',
                    cardLastFour: '4242',
                    cardExpMonth: 12,
                    cardExpYear: 2028
                });

            expect(res.status).toBe(201);
            expect(res.body.paymentMethod).toBeDefined();
            expect(res.body.paymentMethod.cardLastFour).toBe('4242');
            expect(res.body.paymentMethod.isDefault).toBe(true);

            card1Id = res.body.paymentMethod.id;
        });

        it('should add second card without making it default unless specified', async () => {
            const res = await request(app)
                .post('/api/payments/methods')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    type: 'CARD',
                    stripePaymentMethodId: 'pm_mock_mastercard_456',
                    cardBrand: 'Mastercard',
                    cardLastFour: '5555',
                    cardExpMonth: 8,
                    cardExpYear: 2029,
                    isDefault: false
                });

            expect(res.status).toBe(201);
            expect(res.body.paymentMethod.cardLastFour).toBe('5555');
            expect(res.body.paymentMethod.isDefault).toBe(false);

            card2Id = res.body.paymentMethod.id;
        });
    });

    describe('GET /api/payments/methods (List Saved Cards)', () => {
        it('should return all user payment methods securely (masked details, default first)', async () => {
            const res = await request(app)
                .get('/api/payments/methods')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.paymentMethods).toBeDefined();
            expect(res.body.paymentMethods.length).toBe(2);

            // Default card must be first
            expect(res.body.paymentMethods[0].isDefault).toBe(true);
            expect(res.body.paymentMethods[0].cardLastFour).toBe('4242');

            // Verify no sensitive unmasked fields exist
            expect(res.body.paymentMethods[0]).not.toHaveProperty('cardNumber');
            expect(res.body.paymentMethods[0]).not.toHaveProperty('cvv');
        });

        it('should return empty list for user with no saved cards', async () => {
            const res = await request(app)
                .get('/api/payments/methods')
                .set('Authorization', `Bearer ${user2Token}`);

            expect(res.status).toBe(200);
            expect(res.body.paymentMethods).toEqual([]);
        });
    });

    describe('PATCH /api/payments/methods/:id/default (Set Default Method)', () => {
        it('should update card2 to default and unset card1', async () => {
            const res = await request(app)
                .patch(`/api/payments/methods/${card2Id}/default`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.paymentMethod.isDefault).toBe(true);

            // Check card1 is no longer default
            const updatedCard1 = await prisma.paymentMethod.findUnique({ where: { id: card1Id } });
            expect(updatedCard1?.isDefault).toBe(false);
        });

        it('should return 404 when trying to set default on non-existent or other user card', async () => {
            const res = await request(app)
                .patch(`/api/payments/methods/${card1Id}/default`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Payment method not found');
        });
    });

    describe('DELETE /api/payments/methods/:id (Delete Payment Method)', () => {
        it('should return 404 when user tries to delete another user card', async () => {
            const res = await request(app)
                .delete(`/api/payments/methods/${card1Id}`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(res.status).toBe(404);
        });

        it('should delete default card2 and automatically promote remaining card1 to default', async () => {
            const res = await request(app)
                .delete(`/api/payments/methods/${card2Id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Payment method deleted successfully');

            // Verify card2 deleted from DB
            const deletedCard2 = await prisma.paymentMethod.findUnique({ where: { id: card2Id } });
            expect(deletedCard2).toBeNull();

            // Verify remaining card1 promoted to default
            const updatedCard1 = await prisma.paymentMethod.findUnique({ where: { id: card1Id } });
            expect(updatedCard1?.isDefault).toBe(true);
        });
    });
});
