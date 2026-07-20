
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be limited.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-01-27-acacia' as any, // Use latest or stable version
});

export const createPaymentIntent = async (
    amount: number, 
    currency: string = 'usd', 
    metadata: object = {},
    connectedAccountId?: string,
    applicationFeePercent: number = 5
) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || process.env.NODE_ENV === 'development') {
            return {
                id: 'pi_mock_' + Math.random().toString(36).substring(7),
                client_secret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
                status: 'requires_payment_method',
            } as any;
        }

        const params: Stripe.PaymentIntentCreateParams = {
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency,
            metadata: metadata as any,
            automatic_payment_methods: {
                enabled: true,
            },
        };

        if (connectedAccountId) {
            params.transfer_data = {
                destination: connectedAccountId,
            };
            // applicationFeePercent is a percentage (e.g. 5 for 5%)
            const feeAmount = Math.round(amount * 100 * (applicationFeePercent / 100));
            if (feeAmount > 0 && feeAmount < Math.round(amount * 100)) {
                params.application_fee_amount = feeAmount;
            }
        }

        const paymentIntent = await stripe.paymentIntents.create(params);
        return paymentIntent;
    } catch (error) {
        console.error('Stripe PaymentIntent error:', error);
        throw error;
    }
};

export const createConnectAccount = async (email?: string) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || process.env.NODE_ENV === 'development') {
            return {
                id: 'acct_mock_' + Math.random().toString(36).substring(7),
                charges_enabled: false,
                details_submitted: false,
            } as any;
        }
        const account = await stripe.accounts.create({
            type: 'express',
            email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        return account;
    } catch (error) {
        console.error('Stripe createConnectAccount error:', error);
        throw error;
    }
};

export const createAccountLink = async (accountId: string, returnUrl: string, refreshUrl: string) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || process.env.NODE_ENV === 'development') {
            return {
                url: `https://connect.stripe.com/setup/s/mock_${accountId}?return_url=${encodeURIComponent(returnUrl)}&refresh_url=${encodeURIComponent(refreshUrl)}`,
            } as any;
        }
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        return accountLink;
    } catch (error) {
        console.error('Stripe createAccountLink error:', error);
        throw error;
    }
};

export const retrieveConnectAccount = async (accountId: string) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY || process.env.NODE_ENV === 'development') {
            return {
                id: accountId,
                charges_enabled: true,
                details_submitted: true,
            } as any;
        }
        const account = await stripe.accounts.retrieve(accountId);
        return account;
    } catch (error) {
        console.error('Stripe retrieveConnectAccount error:', error);
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
