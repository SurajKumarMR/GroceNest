import { notificationService } from '../../services/notification.service';
import prisma from '../../utils/prisma';
import { smsService } from '../../services/sms.service';

jest.mock('../../utils/prisma', () => ({
    __esModule: true,
    default: {
        notification: {
            create: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        },
        deviceToken: {
            findMany: jest.fn()
        },
        notificationLog: {
            create: jest.fn()
        }
    }
}));

jest.mock('../../services/sms.service', () => ({
    smsService: {
        sendSMS: jest.fn().mockResolvedValue({ sid: 'SM123' })
    }
}));

jest.mock('../../services/socket.service', () => ({
    getIO: jest.fn(() => ({
        to: jest.fn(() => ({
            emit: jest.fn()
        }))
    }))
}));

describe('FCM Push & Twilio SMS Notification Service (notification.service.ts)', () => {
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
});
