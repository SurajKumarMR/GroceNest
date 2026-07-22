import { 
    createPaymentIntent, 
    createConnectAccount, 
    createAccountLink, 
    retrieveConnectAccount, 
    verifyWebhookSignature 
} from '../../services/stripe.service';
import Stripe from 'stripe';

// Mock the Stripe SDK
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => {
        return {
            paymentIntents: {
                create: jest.fn().mockImplementation(async (params) => {
                    return {
                        id: 'pi_mock_sdk_123',
                        client_secret: 'pi_mock_sdk_secret_123',
                        status: 'requires_payment_method',
                        amount: params.amount,
                        currency: params.currency,
                        transfer_data: params.transfer_data,
                        application_fee_amount: params.application_fee_amount,
                    };
                })
            },
            accounts: {
                create: jest.fn().mockResolvedValue({
                    id: 'acct_mock_sdk_123',
                    charges_enabled: false,
                    details_submitted: false,
                }),
                retrieve: jest.fn().mockResolvedValue({
                    id: 'acct_mock_sdk_123',
                    charges_enabled: true,
                    details_submitted: true,
                })
            },
            accountLinks: {
                create: jest.fn().mockResolvedValue({
                    url: 'https://connect.stripe.com/setup/s/mock_sdk_123',
                })
            },
            webhooks: {
                constructEvent: jest.fn().mockImplementation((payload, signature, secret) => {
                    if (secret === 'whsec_invalid') {
                        throw new Error('Invalid signature');
                    }
                    if (signature.includes('replayed')) {
                        throw new Error('Replayed event');
                    }
                    return {
                        id: 'evt_mock_123',
                        type: 'payment_intent.succeeded',
                        data: {
                            object: JSON.parse(payload)
                        }
                    };
                })
            }
        };
    });
});

describe('Stripe Service Unit Tests', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Development Mode / No API Key Fallback', () => {
        beforeEach(() => {
            process.env.STRIPE_SECRET_KEY = '';
            process.env.NODE_ENV = 'development';
        });

        it('should return mocked payment intent in development mode', async () => {
            const res = await createPaymentIntent(15.00);
            expect(res.id).toContain('pi_mock_');
            expect(res.client_secret).toContain('pi_mock_secret_');
        });

        it('should return mocked connect account in development mode', async () => {
            const res = await createConnectAccount('merchant@example.com');
            expect(res.id).toContain('acct_mock_');
            expect(res.charges_enabled).toBe(false);
        });

        it('should return mocked onboarding url in development mode', async () => {
            const res = await createAccountLink('acct_123', 'https://return', 'https://refresh');
            expect(res.url).toContain('connect.stripe.com/setup/s/mock_acct_123');
        });

        it('should return mock active account on retrieve in development mode', async () => {
            const res = await retrieveConnectAccount('acct_123');
            expect(res.id).toBe('acct_123');
            expect(res.charges_enabled).toBe(true);
        });
    });

    describe('Production / API Key Configured (SDK Integration)', () => {
        beforeEach(() => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_actual_mock_key';
            process.env.NODE_ENV = 'production';
        });

        it('should call Stripe SDK paymentIntents.create for normal charge', async () => {
            const res = await createPaymentIntent(10.50, 'usd', { orderId: '456' });
            expect(res.id).toBe('pi_mock_sdk_123');
            expect(res.amount).toBe(1050); // Cents
            expect(res.currency).toBe('usd');
        });

        it('should call Stripe SDK with destination and application fee for connected account charge', async () => {
            const res = await createPaymentIntent(100.00, 'usd', {}, 'acct_merchant_123', 8);
            expect(res.id).toBe('pi_mock_sdk_123');
            expect(res.transfer_data).toEqual({ destination: 'acct_merchant_123' });
            expect(res.application_fee_amount).toBe(800); // 8% of $100 in cents
        });

        it('should call Stripe SDK accounts.create for connect account registration', async () => {
            const res = await createConnectAccount('new_merchant@example.com');
            expect(res.id).toBe('acct_mock_sdk_123');
        });

        it('should call Stripe SDK accountLinks.create for onboarding URL', async () => {
            const res = await createAccountLink('acct_merchant_123', 'https://return', 'https://refresh');
            expect(res.url).toBe('https://connect.stripe.com/setup/s/mock_sdk_123');
        });

        it('should call Stripe SDK accounts.retrieve to get merchant account status', async () => {
            const res = await retrieveConnectAccount('acct_merchant_123');
            expect(res.id).toBe('acct_mock_sdk_123');
            expect(res.charges_enabled).toBe(true);
        });
    });

    describe('Webhook Signature Verification', () => {
        it('should verify webhook signature successfully', () => {
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_correct';
            const payload = JSON.stringify({ id: 'pi_123', amount: 1000 });
            const event = verifyWebhookSignature(payload, 't=123,v1=signature');
            
            expect(event.id).toBe('evt_mock_123');
            expect(event.type).toBe('payment_intent.succeeded');
            expect(event.data.object).toEqual({ id: 'pi_123', amount: 1000 });
        });

        it('should reject invalid webhook signature', () => {
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_invalid';
            const payload = JSON.stringify({ id: 'pi_123' });
            
            expect(() => {
                verifyWebhookSignature(payload, 't=123,v1=signature');
            }).toThrow('Invalid signature');
        });

        it('should reject replayed signature', () => {
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_correct';
            const payload = JSON.stringify({ id: 'pi_123' });
            
            expect(() => {
                verifyWebhookSignature(payload, 't=123,v1=replayed_signature');
            }).toThrow('Replayed event');
        });
    });
});
