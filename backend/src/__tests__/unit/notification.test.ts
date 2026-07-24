import { notificationService } from '../../services/notification.service';
import prisma from '../../utils/prisma';
import { smsService } from '../../services/sms.service';
import { emailService } from '../../services/email.service';

jest.mock('../../utils/prisma', () => ({
    __esModule: true,
    default: {
        notification: {
            create: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        },
        order: {
            findUnique: jest.fn()
        },
        deviceToken: {
            findMany: jest.fn()
        },
        notificationLog: {
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn()
        }
    }
}));

jest.mock('../../services/sms.service', () => ({
    smsService: {
        sendSMS: jest.fn().mockResolvedValue({ sid: 'SM123' })
    }
}));

jest.mock('../../services/email.service', () => ({
    emailService: {
        sendEmail: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
        sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'msg-2' }),
        sendDeliveryReceiptEmail: jest.fn().mockResolvedValue({ messageId: 'msg-3' }),
        sendRefundNotificationEmail: jest.fn().mockResolvedValue({ messageId: 'msg-4' })
    }
}));

jest.mock('../../services/socket.service', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn(() => ({
            emit: jest.fn()
        }))
    }))
}));

describe('FCM Push, Email & SMS Notification Service (notification.service.ts)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create notification and log mock FCM push when FIREBASE_SERVICE_ACCOUNT_JSON is missing', async () => {
        (prisma.notification.create as jest.Mock).mockResolvedValue({
            id: 'notif-123',
            userId: 'user-456',
            type: 'order',
            title: 'Order Update',
            message: 'Your order is on the way!'
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-456',
            notificationPreference: { push: true, sms: false, email: false }
        });

        await notificationService.notifyOrderStatusChange('order-789', 'OUT_FOR_DELIVERY', 'user-456');

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-456',
                type: 'order',
                title: 'Order Update',
                message: 'Your order is on the way!',
                data: { orderId: 'order-789', status: 'OUT_FOR_DELIVERY' }
            }
        });

        expect(prisma.notificationLog.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-456',
                type: 'push',
                channel: 'fcm',
                title: 'Order Update',
                body: 'Your order is on the way!',
                status: 'sent'
            }
        });
    });

    it('should send SMS via Twilio when customer SMS preference is enabled', async () => {
        (prisma.notification.create as jest.Mock).mockResolvedValue({
            id: 'notif-456',
            userId: 'user-789'
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-789',
            phone: '+447911123456',
            notificationPreference: { push: false, sms: true, email: false }
        });

        await notificationService.notifyOrderStatusChange('order-101', 'READY', 'user-789');

        expect(smsService.sendSMS).toHaveBeenCalledWith(
            '+447911123456',
            'Order Update: Your order is ready for pickup.'
        );

        expect(prisma.notificationLog.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-789',
                type: 'sms',
                channel: 'twilio',
                title: 'Order Update',
                body: 'Your order is ready for pickup.',
                status: 'sent'
            }
        });
    });

    it('should NOT send SMS if customer SMS preference is disabled', async () => {
        (prisma.notification.create as jest.Mock).mockResolvedValue({
            id: 'notif-789',
            userId: 'user-789'
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-789',
            phone: '+447911123456',
            notificationPreference: { push: false, sms: false, email: false }
        });

        await notificationService.notifyOrderStatusChange('order-102', 'DELIVERED', 'user-789');

        expect(smsService.sendSMS).not.toHaveBeenCalled();
    });

    it('should send email when email preference is enabled', async () => {
        (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'n-1' });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'u-email',
            email: 'test@example.com',
            notificationPreference: { push: false, sms: false, email: true }
        });

        await notificationService.createNotification({
            userId: 'u-email',
            type: 'system',
            title: 'System Alert',
            message: 'Maintenance scheduled'
        });

        expect(emailService.sendEmail).toHaveBeenCalledWith('test@example.com', 'System Alert', 'Maintenance scheduled');
    });

    it('should notify store owner about new order', async () => {
        const createNotifSpy = jest.spyOn(notificationService, 'createNotification').mockResolvedValue({} as any);

        await notificationService.notifyNewOrder('store-1', 'owner-1', 'ORD-999');
        expect(createNotifSpy).toHaveBeenCalledWith({
            userId: 'owner-1',
            type: 'order',
            title: 'New Order Received',
            message: 'You have a new order: #ORD-999',
            data: { storeId: 'store-1' }
        });

        createNotifSpy.mockRestore();
    });

    it('should send payment confirmation email', async () => {
        (prisma.order.findUnique as jest.Mock).mockResolvedValue({
            id: 'ord-pay',
            userId: 'user-1',
            orderNumber: 'ORD-101',
            totalAmount: 25.50,
            user: { email: 'user@example.com', notificationPreference: { email: true } },
            orderItems: [{ productName: 'Milk', quantity: 2, unitPrice: 1.50 }]
        });

        await notificationService.sendPaymentConfirmationEmail('ord-pay');
        expect(emailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
            'user@example.com',
            'ORD-101',
            25.50,
            [{ name: 'Milk', quantity: 2, price: 1.50 }]
        );
    });

    it('should send order delivery receipt email', async () => {
        (prisma.order.findUnique as jest.Mock).mockResolvedValue({
            id: 'ord-del',
            userId: 'user-1',
            orderNumber: 'ORD-202',
            totalAmount: 30.00,
            user: { email: 'user@example.com', notificationPreference: { email: true } },
            orderItems: [{ productName: 'Bread', quantity: 1, unitPrice: 2.00 }]
        });

        await notificationService.sendOrderDeliveryReceiptEmail('ord-del');
        expect(emailService.sendDeliveryReceiptEmail).toHaveBeenCalledWith(
            'user@example.com',
            'ORD-202',
            30.00,
            [{ name: 'Bread', quantity: 1, price: 2.00 }]
        );
    });

    it('should send refund notification email', async () => {
        (prisma.order.findUnique as jest.Mock).mockResolvedValue({
            id: 'ord-ref',
            userId: 'user-1',
            orderNumber: 'ORD-303',
            user: { email: 'user@example.com', notificationPreference: { email: true } }
        });

        await notificationService.sendRefundNotificationEmail('ord-ref', 15.00, 'Damaged item');
        expect(emailService.sendRefundNotificationEmail).toHaveBeenCalledWith(
            'user@example.com',
            'ORD-303',
            15.00,
            'Damaged item'
        );
    });

    it('should mark notification log delivered', async () => {
        (prisma.notificationLog.update as jest.Mock).mockResolvedValue({ id: 'log-1', status: 'delivered' });

        const result = await notificationService.markNotificationDelivered('log-1');
        expect(result.status).toBe('delivered');
    });

    it('should calculate delivery stats and flag high failure rate', async () => {
        (prisma.notificationLog.findMany as jest.Mock).mockResolvedValue([
            { id: '1', type: 'email', status: 'sent', sentAt: new Date() },
            { id: '2', type: 'email', status: 'delivered', sentAt: new Date() },
            { id: '3', type: 'sms', status: 'failed', sentAt: new Date(), error: 'Invalid number' },
            { id: '4', type: 'sms', status: 'failed', sentAt: new Date(), error: 'Timeout' },
            { id: '5', type: 'push', status: 'failed', sentAt: new Date(), error: 'Token expired' }
        ]);

        const stats = await notificationService.getDeliveryStats(7);
        expect(stats.total).toBe(5);
        expect(stats.failedCount).toBe(3);
        expect(stats.failureRate).toBe(60);
        expect(stats.highFailureRate).toBe(true);
        expect(stats.recentFailures.length).toBe(3);
    });
});
