
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be limited.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-01-27-acacia' as any, // Use latest or stable version
});

export const createPaymentIntent = async (amount: number, currency: string = 'usd', metadata: object = {}) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || process.env.NODE_ENV === 'development') {
            return {
                id: 'pi_mock_' + Math.random().toString(36).substring(7),
                client_secret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
                status: 'requires_payment_method',
            } as any;
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency,
            metadata: metadata as any,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return paymentIntent;
    } catch (error) {
        console.error('Stripe PaymentIntent error:', error);
        throw error;
    }
};

export const verifyWebhookSignature = (payload: string | Buffer, signature: string) => {
    try {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
        );
        return event;
    } catch (error) {
        console.error('Stripe Webhook signature verification failed:', error);
        throw error;
    }
};

export default stripe;
