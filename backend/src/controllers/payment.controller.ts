import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { 
    createPaymentIntent, 
    verifyWebhookSignature,
    createConnectAccount,
    createAccountLink,
    retrieveConnectAccount
} from '../services/stripe.service';
import prisma from '../utils/prisma';
import Stripe from 'stripe';
import { analyticsService } from '../services/analytics.service';
import { monitoringService } from '../services/monitoring.service';

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
    if ((req as any).rawBody) {
        body = (req as any).rawBody;
    } else if (Buffer.isBuffer(req.body)) {
        body = req.body;
    } else {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    try {
        event = verifyWebhookSignature(body, sig as string);
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Idempotency check & atomic event reservation
    try {
        await (prisma as any).processedWebhook.create({
            data: { eventId: event.id }
        });
    } catch (e: any) {
        if (e.code === 'P2002') {
            res.json({ received: true, alreadyProcessed: true });
            return;
        }
        throw e;
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        const metadataUserId = paymentIntent.metadata.userId;

        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'paid',
                    statusHistory: {
                        create: {
                            status: 'PAID',
                            note: 'Payment successful via Stripe'
                        }
                    }
                }
            });

            // Track payment completed
            await analyticsService.trackPaymentCompleted(metadataUserId, orderId, Number(paymentIntent.amount) / 100, paymentIntent.id);
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        const metadataUserId = paymentIntent.metadata.userId;

        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'failed'
                }
            });

            // Track payment failed & trigger real-time monitoring alert
            const failReason = paymentIntent.last_payment_error?.message || 'Payment failed';
            await analyticsService.trackPaymentFailed(
                metadataUserId,
                orderId,
                Number(paymentIntent.amount) / 100,
                failReason
            );
            await monitoringService.alertPaymentFailure(
                orderId,
                metadataUserId,
                Number(paymentIntent.amount) / 100,
                failReason
            );
        }
    }

    res.json({ received: true });
};
