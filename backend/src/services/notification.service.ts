
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

            // 2. Emit via socket to the user's private room if socket server is running
            try {
                const io = getIO();
                if (io) {
                    io.to(`user_${data.userId}`).emit('newNotification', notification);
                }
            } catch (ioError) {
                // Socket IO is optional in non-web server / test contexts
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

        // Also broadcast the status update to the order's room for live UI badges if socket server is running
        try {
            const io = getIO();
            if (io) {
                io.to(`order_${orderId}`).emit('statusUpdate', { orderId, status });
            }
        } catch (ioError) {
            // Socket IO is optional in non-web server / test contexts
        }

        // Trigger delivery receipt email if order is marked DELIVERED
        if (status === 'DELIVERED') {
            await notificationService.sendOrderDeliveryReceiptEmail(orderId).catch(err => {
                console.error('Failed to trigger order delivery receipt email:', err);
            });
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
    },

    /**
     * Send payment confirmation email with attached invoice
     */
    sendPaymentConfirmationEmail: async (orderId: string) => {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: { include: { notificationPreference: true } },
                    orderItems: true
                }
            });

            if (!order || !order.userId || !order.user?.email) return;

            const userId = order.userId;

            const prefs = order.user.notificationPreference || { email: true, sms: true, push: true };
            if (!prefs.email) return;

            const items = order.orderItems.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: Number(item.unitPrice)
            }));

            try {
                await emailService.sendOrderConfirmationEmail(
                    order.user.email,
                    order.orderNumber,
                    Number(order.totalAmount),
                    items
                );

                await prisma.notificationLog.create({
                    data: {
                        userId: userId,
                        type: 'email',
                        channel: 'sendgrid',
                        title: `Order Confirmation #${order.orderNumber}`,
                        body: `Order confirmation & invoice sent for £${Number(order.totalAmount).toFixed(2)}`,
                        status: 'sent'
                    }
                });
            } catch (err: any) {
                console.error('Send payment confirmation email error:', err);
                await prisma.notificationLog.create({
                    data: {
                        userId: userId,
                        type: 'email',
                        channel: 'sendgrid',
                        title: `Order Confirmation #${order.orderNumber}`,
                        body: `Order confirmation & invoice failed to send`,
                        status: 'failed',
                        error: err.message
                    }
                });
            }
        } catch (error) {
            console.error('Error in sendPaymentConfirmationEmail:', error);
        }
    },

    /**
     * Send order delivery receipt email with attached invoice
     */
    sendOrderDeliveryReceiptEmail: async (orderId: string) => {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: { include: { notificationPreference: true } },
                    orderItems: true
                }
            });

            if (!order || !order.userId || !order.user?.email) return;

            const userId = order.userId;

            const prefs = order.user.notificationPreference || { email: true, sms: true, push: true };
            if (!prefs.email) return;

            const items = order.orderItems.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: Number(item.unitPrice)
            }));

            try {
                await emailService.sendDeliveryReceiptEmail(
                    order.user.email,
                    order.orderNumber,
                    Number(order.totalAmount),
                    items
                );

                await prisma.notificationLog.create({
                    data: {
                        userId: userId,
                        type: 'email',
                        channel: 'sendgrid',
                        title: `Order Delivered #${order.orderNumber}`,
                        body: `Delivery receipt & invoice sent for £${Number(order.totalAmount).toFixed(2)}`,
                        status: 'sent'
                    }
                });
            } catch (err: any) {
                console.error('Send delivery receipt email error:', err);
                await prisma.notificationLog.create({
                    data: {
                        userId: userId,
                        type: 'email',
                        channel: 'sendgrid',
                        title: `Order Delivered #${order.orderNumber}`,
                        body: `Delivery receipt email failed to send`,
                        status: 'failed',
                        error: err.message
                    }
                });
            }
        } catch (error) {
            console.error('Error in sendOrderDeliveryReceiptEmail:', error);
        }
    },

    /**
     * Send refund notification email
     */
    sendRefundNotificationEmail: async (orderId: string, refundAmount: number, reason?: string) => {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: { include: { notificationPreference: true } }
                }
            });

            if (!order || !order.userId || !order.user?.email) return;

            const userId = order.userId;

            const prefs = order.user.notificationPreference || { email: true, sms: true, push: true };
            if (!prefs.email) return;

            try {
                await emailService.sendRefundNotificationEmail(
                    order.user.email,
                    order.orderNumber,
                    refundAmount,
                    reason
                );

                await prisma.notificationLog.create({
                    data: {
                        userId: userId,
                        type: 'email',
                        channel: 'sendgrid',
                        title: `Refund Processed #${order.orderNumber}`,
                        body: `Refund notification sent for £${refundAmount.toFixed(2)}`,
                        status: 'sent'
                    }
                });
            } catch (err: any) {
                console.error('Send refund notification email error:', err);
                await prisma.notificationLog.create({
                    data: {
                        userId: userId,
                        type: 'email',
                        channel: 'sendgrid',
                        title: `Refund Processed #${order.orderNumber}`,
                        body: `Refund notification email failed to send`,
                        status: 'failed',
                        error: err.message
                    }
                });
            }
        } catch (error) {
            console.error('Error in sendRefundNotificationEmail:', error);
        }
    },

    /**
     * Mark a notification log as delivered
     */
    markNotificationDelivered: async (logId: string) => {
        try {
            return await prisma.notificationLog.update({
                where: { id: logId },
                data: {
                    status: 'delivered',
                    deliveredAt: new Date()
                }
            });
        } catch (error) {
            console.error('Error updating notification log delivery status:', error);
            throw error;
        }
    },

    /**
     * Get delivery statistics and check for high failure rate alerts (>15%)
     */
    getDeliveryStats: async (days: number = 7) => {
        try {
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - days);

            const logs = await prisma.notificationLog.findMany({
                where: {
                    sentAt: { gte: sinceDate }
                },
                orderBy: { sentAt: 'desc' }
            });

            const total = logs.length;
            const failedCount = logs.filter(l => l.status === 'failed').length;
            const deliveredCount = logs.filter(l => l.status === 'delivered').length;
            const sentCount = logs.filter(l => l.status === 'sent').length;

            const failureRate = total > 0 ? (failedCount / total) * 100 : 0;
            const deliveryRate = total > 0 ? ((sentCount + deliveredCount) / total) * 100 : 100;
            const highFailureRate = total >= 5 && failureRate > 15;

            const channelStats: Record<string, { total: number; failed: number; sent: number; delivered: number }> = {
                push: { total: 0, failed: 0, sent: 0, delivered: 0 },
                sms: { total: 0, failed: 0, sent: 0, delivered: 0 },
                email: { total: 0, failed: 0, sent: 0, delivered: 0 }
            };

            logs.forEach(l => {
                const type = l.type || 'other';
                if (!channelStats[type]) {
                    channelStats[type] = { total: 0, failed: 0, sent: 0, delivered: 0 };
                }
                channelStats[type].total++;
                if (l.status === 'failed') channelStats[type].failed++;
                if (l.status === 'sent') channelStats[type].sent++;
                if (l.status === 'delivered') channelStats[type].delivered++;
            });

            const recentFailures = logs
                .filter(l => l.status === 'failed')
                .slice(0, 10)
                .map(l => ({
                    id: l.id,
                    type: l.type,
                    channel: l.channel,
                    title: l.title,
                    error: l.error || 'Unknown delivery failure',
                    sentAt: l.sentAt
                }));

            if (highFailureRate) {
                console.warn(`[ALERT] High notification failure rate detected: ${failureRate.toFixed(1)}% (${failedCount}/${total} failed)`);
            }

            return {
                total,
                sentCount,
                deliveredCount,
                failedCount,
                deliveryRate: Number(deliveryRate.toFixed(2)),
                failureRate: Number(failureRate.toFixed(2)),
                highFailureRate,
                alertThresholdExceeded: highFailureRate,
                channelStats,
                recentFailures,
                windowDays: days
            };
        } catch (error) {
            console.error('Error fetching notification delivery stats:', error);
            throw error;
        }
    }
};
