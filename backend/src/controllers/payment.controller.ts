import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { 
    createPaymentIntent, 
    verifyWebhookSignature,
    createConnectAccount,
    createAccountLink,
    retrieveConnectAccount,
    createRefund
} from '../services/stripe.service';
import prisma from '../utils/prisma';
import Stripe from 'stripe';
import { analyticsService } from '../services/analytics.service';
import { monitoringService } from '../services/monitoring.service';
import { emailService } from '../services/email.service';
import { notificationService } from '../services/notification.service';

export const initPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, store: true }
        });

        if (!order || order.userId !== userId) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Security: Verify total amount consistency on the server
        const calculatedTotal = Number(order.subtotal) + Number(order.deliveryFee) + Number(order.taxAmount) + Number(order.tipAmount);
        if (Math.abs(calculatedTotal - Number(order.totalAmount)) > 0.01) {
            console.error(`[SECURITY] Order total mismatch for order ${orderId}. Expected ${calculatedTotal}, got ${order.totalAmount}`);
            res.status(400).json({ error: 'Invalid order total' });
            return;
        }

        // Use Stripe Connect destination charge if store is onboarded
        let connectedAccountId: string | undefined = undefined;
        if (order.store && order.store.stripeAccountId && order.store.stripeOnboardingStatus === 'completed') {
            connectedAccountId = order.store.stripeAccountId;
        }

        const paymentIntent = await createPaymentIntent(
            Number(order.totalAmount), 
            'usd', 
            {
                orderId: order.id,
                userId: userId
            },
            connectedAccountId
        );

        // Update order with payment intent ID
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentIntentId: paymentIntent.id }
        });

        // Track checkout started
        await analyticsService.trackCheckoutStarted(userId, order.id, Number(order.totalAmount));

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Init payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const onboardStoreConnect = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const store = await prisma.store.findFirst({
            where: { id: storeId, ownerId: userId }
        });

        if (!store) {
            res.status(404).json({ error: 'Store not found or you are not the owner' });
            return;
        }

        let accountId = store.stripeAccountId || '';
        if (!accountId) {
            const email = req.user?.email || store.email || undefined;
            const account = await createConnectAccount(email);
            accountId = account.id;

            await prisma.store.update({
                where: { id: store.id },
                data: {
                    stripeAccountId: accountId,
                    stripeOnboardingStatus: 'pending'
                }
            });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const returnUrl = `${frontendUrl}/payments/connect/callback?storeId=${store.id}`;
        const refreshUrl = `${frontendUrl}/payments/connect/refresh?storeId=${store.id}`;

        const accountLink = await createAccountLink(accountId, returnUrl, refreshUrl);

        res.json({ url: accountLink.url });
    } catch (error) {
        console.error('Stripe Connect onboarding error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const onboardCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { storeId } = req.query;

        if (!storeId || typeof storeId !== 'string') {
            res.status(400).json({ error: 'Invalid storeId' });
            return;
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store || !store.stripeAccountId) {
            res.status(404).json({ error: 'Store or Stripe account not found' });
            return;
        }

        const account = await retrieveConnectAccount(store.stripeAccountId as string);
        const onboardingStatus = account.details_submitted ? 'completed' : 'pending';

        await prisma.store.update({
            where: { id: store.id },
            data: {
                stripeOnboardingStatus: onboardingStatus
            }
        });

        res.json({ status: onboardingStatus });
    } catch (error) {
        console.error('Stripe Connect callback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        res.status(400).send('Webhook Error: Missing signature');
        return;
    }

    let event: Stripe.Event;
    let body: string | Buffer;
    if ((req as any).rawBody && Buffer.isBuffer((req as any).rawBody)) {
        body = (req as any).rawBody;
    } else if (Buffer.isBuffer(req.body)) {
        body = req.body;
    } else if (typeof req.body === 'string') {
        body = req.body;
    } else {
        res.status(400).send('Webhook Error: Raw request body required for signature verification');
        return;
    }

    try {
        event = verifyWebhookSignature(body, sig as string);
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Idempotency check & atomic event reservation
    try {
        await prisma.processedWebhook.create({
            data: { eventId: event.id }
        });
    } catch (e: any) {
        if (e.code === 'P2002') {
            res.json({ received: true, alreadyProcessed: true });
            return;
        }
        throw e;
    }

    // Handle the event safely with fallback order lookup and error isolation
    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const metadataOrderId = paymentIntent.metadata?.orderId;
            let order = metadataOrderId
                ? await prisma.order.findUnique({
                    where: { id: metadataOrderId },
                    include: { user: { include: { notificationPreference: true } }, orderItems: true }
                })
                : null;

            if (!order && paymentIntent.id) {
                order = await prisma.order.findFirst({
                    where: { paymentIntentId: paymentIntent.id },
                    include: { user: { include: { notificationPreference: true } }, orderItems: true }
                });
            }

            if (order) {
                const userId = paymentIntent.metadata?.userId || order.userId || 'guest';
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'paid',
                        statusHistory: {
                            create: {
                                status: 'PAID',
                                note: 'Payment successful via Stripe'
                            }
                        }
                    },
                    include: {
                        user: { include: { notificationPreference: true } },
                        orderItems: true,
                    }
                });

                // Track payment completed
                try {
                    await analyticsService.trackPaymentCompleted(userId, order.id, Number(paymentIntent.amount) / 100, paymentIntent.id);
                } catch (err) {
                    console.error('Failed to track payment completed in analytics:', err);
                }

                // Send Order Confirmation & Invoice Email via notificationService
                try {
                    await notificationService.sendPaymentConfirmationEmail(order.id);
                } catch (err) {
                    console.error('Failed to trigger payment confirmation email via notificationService:', err);
                }
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const metadataOrderId = paymentIntent.metadata?.orderId;
            let order = metadataOrderId
                ? await prisma.order.findUnique({ where: { id: metadataOrderId } })
                : null;

            if (!order && paymentIntent.id) {
                order = await prisma.order.findFirst({ where: { paymentIntentId: paymentIntent.id } });
            }

            if (order) {
                const failReason = paymentIntent.last_payment_error?.message || 'Payment failed';
                const userId = paymentIntent.metadata?.userId || order.userId || 'guest';

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'failed',
                        statusHistory: {
                            create: {
                                status: 'PAYMENT_FAILED',
                                note: `Payment failed: ${failReason}`
                            }
                        }
                    }
                });

                // Track payment failed & trigger real-time monitoring alert
                try {
                    await analyticsService.trackPaymentFailed(
                        userId,
                        order.id,
                        Number(paymentIntent.amount) / 100,
                        failReason
                    );
                } catch (err) {
                    console.error('Failed to track payment failure in analytics:', err);
                }

                try {
                    await monitoringService.alertPaymentFailure(
                        order.id,
                        userId,
                        Number(paymentIntent.amount) / 100,
                        failReason
                    );
                } catch (err) {
                    console.error('Failed to send payment failure monitoring alert:', err);
                }
            }
        } else if (event.type === 'charge.refunded') {
            const charge = event.data.object as Stripe.Charge;
            const metadataOrderId = charge.metadata?.orderId;
            const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : (charge.payment_intent as any)?.id;

            let order = metadataOrderId
                ? await prisma.order.findUnique({
                    where: { id: metadataOrderId },
                    include: { user: { include: { notificationPreference: true } } }
                })
                : null;

            if (!order && paymentIntentId) {
                order = await prisma.order.findFirst({
                    where: { paymentIntentId },
                    include: { user: { include: { notificationPreference: true } } }
                });
            }

            if (order) {
                const refundAmount = Number(charge.amount_refunded) / 100;
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatus: 'refunded',
                        statusHistory: {
                            create: {
                                status: 'REFUNDED',
                                note: `Charge refunded via webhook: £${refundAmount.toFixed(2)}`
                            }
                        }
                    }
                });

                try {
                    await analyticsService.trackPaymentRefunded(order.userId || 'guest', order.id, refundAmount, 'Charge refunded via webhook');
                } catch (err) {
                    console.error('Failed to track payment refund in analytics:', err);
                }

                try {
                    await notificationService.sendRefundNotificationEmail(order.id, refundAmount, 'Refund processed');
                } catch (err) {
                    console.error('Failed to trigger refund email via notificationService:', err);
                }
            }
        }
    } catch (processingError) {
        console.error(`Error processing webhook event ${event.id}:`, processingError);
        // Release processedWebhook lock on failure so Stripe can retry
        await prisma.processedWebhook.delete({ where: { eventId: event.id } }).catch(() => {});
        res.status(500).send('Webhook processing error');
        return;
    }

    res.json({ received: true });
};

export const processRefund = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId, amount, reason } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { 
                store: true,
                user: { include: { notificationPreference: true } } 
            }
        });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (order.paymentStatus === 'refunded') {
            res.status(400).json({ error: 'Order is already refunded' });
            return;
        }

        const refundAmount = amount ? Number(amount) : Number(order.totalAmount);
        let stripeRefund: any = null;

        // Process refund via Stripe if paymentIntentId is present
        if (order.paymentIntentId) {
            try {
                stripeRefund = await createRefund(order.paymentIntentId, refundAmount, reason);
            } catch (stripeErr: any) {
                console.error('Stripe refund processing failed:', stripeErr);
                res.status(500).json({ error: `Stripe refund failed: ${stripeErr.message || 'Unknown error'}` });
                return;
            }
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'refunded',
                statusHistory: {
                    create: {
                        status: 'REFUNDED',
                        note: `Refund processed: £${refundAmount.toFixed(2)}${reason ? ` (${reason})` : ''}`
                    }
                }
            }
        });

        // Track analytics safely
        try {
            await analyticsService.trackPaymentRefunded(order.userId || userId, order.id, refundAmount, reason);
        } catch (err) {
            console.error('Failed to track payment refund in analytics:', err);
        }

        // Notify Customer (In-App + Email)
        if (order.userId) {
            try {
                await notificationService.createNotification({
                    userId: order.userId,
                    type: 'order',
                    title: 'Refund Processed',
                    message: `A refund of £${refundAmount.toFixed(2)} has been processed for your order #${order.orderNumber}.`,
                    data: { orderId: order.id, amount: refundAmount }
                });
            } catch (err) {
                console.error('Failed to send customer in-app refund notification:', err);
            }

            try {
                await notificationService.sendRefundNotificationEmail(order.id, refundAmount, reason);
            } catch (err) {
                console.error('Failed to trigger customer refund email:', err);
            }
        }

        // Notify Merchant / Store Owner
        if (order.store && order.store.ownerId) {
            try {
                await notificationService.createNotification({
                    userId: order.store.ownerId,
                    type: 'order',
                    title: 'Order Refunded',
                    message: `Order #${order.orderNumber} has been refunded (£${refundAmount.toFixed(2)}).`,
                    data: { orderId: order.id, storeId: order.storeId, amount: refundAmount }
                });
            } catch (err) {
                console.error('Failed to send merchant refund notification:', err);
            }
        }

        res.json({ 
            message: 'Refund processed successfully', 
            order: updatedOrder,
            refund: stripeRefund 
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFinancialAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
        const metrics = await analyticsService.getFinancialAnalyticsMetrics(isNaN(days) ? 30 : days);
        res.json(metrics);
    } catch (error) {
        console.error('Get financial analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
