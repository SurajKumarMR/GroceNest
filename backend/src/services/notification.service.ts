
import prisma from '../utils/prisma';
import { getIO } from './socket.service';
import { initializeApp, cert } from 'firebase-admin';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { decrypt } from '../utils/encryption.utils';
import { smsService } from './sms.service';
import { emailService } from './email.service';
import * as Sentry from '@sentry/node';

// Initialize Firebase Admin if JSON credentials are provided
let fcmEnabled = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        initializeApp({
            credential: cert(serviceAccount)
        });
        fcmEnabled = true;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
    }
}

const sendFcmPush = async (userId: string, title: string, body: string, data?: any) => {
    try {
        if (!fcmEnabled) {
            console.log(`[FCM MOCK] Push notification to user_${userId}: "${title}" - "${body}"`);
            await prisma.notificationLog.create({
                data: {
                    userId,
                    type: 'push',
                    channel: 'fcm',
                    title,
                    body,
                    status: 'sent'
                }
            });
            return;
        }

        const deviceTokens = await prisma.deviceToken.findMany({
            where: { userId }
        });

        if (deviceTokens.length === 0) {
            return;
        }

        const tokens = deviceTokens.map(dt => dt.token);

        const payload: MulticastMessage = {
            tokens,
            notification: {
                title,
                body
            },
            data: data ? { data: JSON.stringify(data) } : undefined
        };

        const response = await getMessaging().sendEachForMulticast(payload);
        
        const failedCount = response.failureCount;
        const successCount = response.successCount;

        await prisma.notificationLog.create({
            data: {
                userId,
                type: 'push',
                channel: 'fcm',
                title,
                body,
                status: failedCount > 0 && successCount === 0 ? 'failed' : 'sent',
                error: failedCount > 0 ? `Failed sending to ${failedCount} devices` : null
            }
        });
    } catch (error: any) {
        console.error('Error sending FCM push:', error);
        Sentry.captureException(error);
        await prisma.notificationLog.create({
            data: {
                userId,
                type: 'push',
                channel: 'fcm',
                title,
                body,
                status: 'failed',
                error: error.message
            }
        });
    }
};

export const notificationService = {
    /**
     * Create a notification and send it via socket
     */
    createNotification: async (data: {
        userId: string;
        type: 'order' | 'promotion' | 'system' | 'review';
        title: string;
        message: string;
        data?: any;
    }) => {
        try {
            // 1. Save to database
            const notification = await prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    data: data.data || {}
                }
            });

            // 2. Emit via socket to the user's private room
            const io = getIO();
            if (io) {
                io.to(`user_${data.userId}`).emit('newNotification', notification);
            }

            // 3. Fetch user and preferences
            const user = await prisma.user.findUnique({
                where: { id: data.userId },
                include: { notificationPreference: true }
            });

            if (user) {
                const prefs = user.notificationPreference || { email: true, sms: true, push: true };

                // 4. Send Push if enabled
                if (prefs.push) {
                    await sendFcmPush(data.userId, data.title, data.message, data.data);
                }

                // 5. Send SMS if enabled and user has phone
                if (prefs.sms && user.phone) {
                    let decryptedPhone = '';
                    try {
                        decryptedPhone = decrypt(user.phone);
                    } catch (e) {
                        decryptedPhone = user.phone;
                    }
                    if (decryptedPhone) {
                        try {
                            await smsService.sendSMS(decryptedPhone, `${data.title}: ${data.message}`);
                            await prisma.notificationLog.create({
                                data: {
                                    userId: data.userId,
                                    type: 'sms',
                                    channel: 'twilio',
                                    title: data.title,
                                    body: data.message,
                                    status: 'sent'
                                }
                            });
                        } catch (smsError: any) {
                            console.error('Error sending SMS via Twilio:', smsError);
                            await prisma.notificationLog.create({
                                data: {
                                    userId: data.userId,
                                    type: 'sms',
                                    channel: 'twilio',
                                    title: data.title,
                                    body: data.message,
                                    status: 'failed',
                                    error: smsError.message
                                }
                            });
                        }
                    }
                }

                // 6. Send Email if enabled and user has email
                if (prefs.email && user.email) {
                    try {
                        await emailService.sendEmail(user.email, data.title, data.message);
                        await prisma.notificationLog.create({
                            data: {
                                userId: data.userId,
                                type: 'email',
                                channel: 'sendgrid',
                                title: data.title,
                                body: data.message,
                                status: 'sent'
                            }
                        });
                    } catch (emailError: any) {
                        console.error('Error sending Email:', emailError);
                        await prisma.notificationLog.create({
                            data: {
                                userId: data.userId,
                                type: 'email',
                                channel: 'sendgrid',
                                title: data.title,
                                body: data.message,
                                status: 'failed',
                                error: emailError.message
                            }
                        });
                    }
                }
            }

            return notification;
        } catch (error) {
            console.error('Create notification error:', error);
            Sentry.captureException(error);
            throw error;
        }
    },

    /**
     * Notify customer about order status change
     */
    notifyOrderStatusChange: async (orderId: string, status: string, userId: string) => {
        const statusMap: Record<string, string> = {
            'CONFIRMED': 'Your order has been confirmed!',
            'PREPARING': 'The store is preparing your order.',
            'READY': 'Your order is ready for pickup.',
            'OUT_FOR_DELIVERY': 'Your order is on the way!',
            'DELIVERED': 'Order delivered. Enjoy your meal!',
            'CANCELLED': 'Your order has been cancelled.'
        };

        const message = statusMap[status] || `Order status updated to ${status}`;

        await notificationService.createNotification({
            userId,
            type: 'order',
            title: 'Order Update',
            message,
            data: { orderId, status }
        });

        // Also broadcast the status update to the order's room for live UI badges
        const io = getIO();
        if (io) {
            io.to(`order_${orderId}`).emit('statusUpdate', { orderId, status });
        }
    },

    /**
     * Notify store owner about new order
     */
    notifyNewOrder: async (storeId: string, ownerId: string, orderNumber: string) => {
        await notificationService.createNotification({
            userId: ownerId,
            type: 'order',
            title: 'New Order Received',
            message: `You have a new order: #${orderNumber}`,
            data: { storeId }
        });
    }
};
