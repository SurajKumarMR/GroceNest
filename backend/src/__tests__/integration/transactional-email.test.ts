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

import prisma from '../../utils/prisma';
import { Role } from '@prisma/client';
import { notificationService } from '../../services/notification.service';
import { emailService } from '../../services/email.service';

describe('Transactional Email & SendGrid Integration Tests (notification.service.ts)', () => {
    let userId: string;
    let storeId: string;
    let productId: string;
    let orderId: string;
    let orderNumber: string = `ORD-TEST-${Date.now()}`;

    beforeAll(async () => {
        // Create customer user
        const user = await prisma.user.create({
            data: {
                email: `transactional-email-${Date.now()}@example.com`,
                firstName: 'Email',
                lastName: 'Customer',
                passwordHash: 'dummyhash',
                role: Role.CUSTOMER,
                notificationPreference: {
                    create: {
                        email: true,
                        sms: true,
                        push: true
                    }
                }
            }
        });
        userId = user.id;

        // Create store
        const store = await prisma.store.create({
            data: {
                name: 'Email Test Store',
                slug: `email-test-store-${Date.now()}`,
                streetAddress: '123 Test St',
                city: 'London',
                postalCode: 'SW1A 1AA',
                country: 'UK',
                latitude: 51.5074,
                longitude: -0.1278,
                cuisineTypes: ['groceries'],
                ownerId: userId
            }
        });
        storeId = store.id;

        // Create product
        const product = await prisma.product.create({
            data: {
                name: 'Organic Apples',
                slug: `organic-apples-${Date.now()}`,
                regularPrice: 3.50,
                stockQuantity: 100,
                unit: 'kg',
                storeId: store.id
            }
        });
        productId = product.id;

        // Create order with orderItems
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId,
                storeId,
                subtotal: 10.50,
                totalAmount: 10.50,
                status: 'CONFIRMED',
                paymentStatus: 'paid',
                orderItems: {
                    create: [
                        {
                            productId,
                            productName: 'Organic Apples',
                            quantity: 3,
                            unitPrice: 3.50,
                            subtotal: 10.50
                        }
                    ]
                }
            }
        });
        orderId = order.id;
    });

    afterAll(async () => {
        await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
        await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
        await prisma.store.deleteMany({ where: { id: storeId } }).catch(() => {});
        await prisma.notificationLog.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.notificationPreference.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
        await prisma.$disconnect();
    });

    describe('sendPaymentConfirmationEmail', () => {
        it('should dispatch payment confirmation email with attached invoice log', async () => {
            const sendSpy = jest.spyOn(emailService, 'sendOrderConfirmationEmail');

            await notificationService.sendPaymentConfirmationEmail(orderId);

            expect(sendSpy).toHaveBeenCalledWith(
                expect.stringContaining('@example.com'),
                orderNumber,
                10.50,
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Organic Apples', quantity: 3, price: 3.5 })
                ])
            );

            const logs = await prisma.notificationLog.findMany({
                where: { userId, type: 'email', channel: 'sendgrid' }
            });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].status).toBe('sent');
            expect(logs[0].title).toContain('Order Confirmation');

            sendSpy.mockRestore();
        });
    });

    describe('sendOrderDeliveryReceiptEmail', () => {
        it('should dispatch order delivery receipt email with attached invoice when order status is DELIVERED', async () => {
            const sendSpy = jest.spyOn(emailService, 'sendDeliveryReceiptEmail');

            await notificationService.notifyOrderStatusChange(orderId, 'DELIVERED', userId);

            expect(sendSpy).toHaveBeenCalledWith(
                expect.stringContaining('@example.com'),
                orderNumber,
                10.50,
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Organic Apples', quantity: 3, price: 3.5 })
                ])
            );

            const logs = await prisma.notificationLog.findMany({
                where: { userId, type: 'email', title: { contains: 'Delivered' } }
            });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].status).toBe('sent');

            sendSpy.mockRestore();
        });
    });

    describe('sendRefundNotificationEmail', () => {
        it('should dispatch refund notification email and record log', async () => {
            const sendSpy = jest.spyOn(emailService, 'sendRefundNotificationEmail');

            await notificationService.sendRefundNotificationEmail(orderId, 10.50, 'Damaged items');

            expect(sendSpy).toHaveBeenCalledWith(
                expect.stringContaining('@example.com'),
                orderNumber,
                10.50,
                'Damaged items'
            );

            const logs = await prisma.notificationLog.findMany({
                where: { userId, type: 'email', title: { contains: 'Refund' } }
            });

            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].status).toBe('sent');

            sendSpy.mockRestore();
        });
    });

    describe('Email Opt-Out Preference Enforcement', () => {
        it('should NOT dispatch transactional emails if user opted out of email notifications', async () => {
            await prisma.notificationPreference.update({
                where: { userId },
                data: { email: false }
            });

            const sendSpy = jest.spyOn(emailService, 'sendOrderConfirmationEmail');
            await prisma.notificationLog.deleteMany({ where: { userId } });

            await notificationService.sendPaymentConfirmationEmail(orderId);

            expect(sendSpy).not.toHaveBeenCalled();

            const logs = await prisma.notificationLog.findMany({
                where: { userId, type: 'email' }
            });
            expect(logs.length).toBe(0);

            sendSpy.mockRestore();
        });
    });
});
