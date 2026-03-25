
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { createPaymentIntent, verifyWebhookSignature } from '../services/stripe.service';
import prisma from '../utils/prisma';
import Stripe from 'stripe';

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
            include: { user: true }
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

        const paymentIntent = await createPaymentIntent(Number(order.totalAmount), 'usd', {
            orderId: order.id,
            userId: userId
        });

        // Update order with payment intent ID
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentIntentId: paymentIntent.id }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Init payment error:', error);
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
    const body = (req as any).rawBody || req.body;

    try {
        event = verifyWebhookSignature(body, sig as string);
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Idempotency check: Ensure we haven't processed this event before
    const existingEvent = await (prisma as any).processedWebhook.findUnique({
        where: { eventId: event.id }
    });

    if (existingEvent) {
        res.json({ received: true, alreadyProcessed: true });
        return;
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

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
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'failed'
                }
            });
        }
    }

    // Mark event as processed
    await (prisma as any).processedWebhook.create({
        data: { eventId: event!.id }
    });

    res.json({ received: true });
};
