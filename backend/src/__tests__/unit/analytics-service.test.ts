import { analyticsService } from '../../services/analytics.service';
import prisma from '../../utils/prisma';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Analytics Service Unit Tests (analytics.service.ts)', () => {
    beforeEach(() => {
        analyticsService.clearQueue();
        jest.clearAllMocks();
        delete process.env.MIXPANEL_TOKEN;
        delete process.env.AMPLITUDE_API_KEY;
    });

    afterEach(() => {
        analyticsService.clearQueue();
    });

    it('should enqueue events non-blockingly without waiting for DB or network', async () => {
        await analyticsService.trackEvent('TEST_EVENT', 'user-123', { key: 'value' });
        expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should flush batch to database on demand', async () => {
        const createManySpy = jest.spyOn(prisma.analyticsEvent, 'createMany').mockResolvedValue({ count: 2 });

        await analyticsService.trackEvent('EVENT_1', 'user-1');
        await analyticsService.trackEvent('EVENT_2', 'user-2');

        expect(analyticsService.getQueueSize()).toBe(2);

        await analyticsService.flush();

        expect(createManySpy).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ eventName: 'EVENT_1', userId: 'user-1' }),
                expect.objectContaining({ eventName: 'EVENT_2', userId: 'user-2' })
            ])
        });
        expect(analyticsService.getQueueSize()).toBe(0);

        createManySpy.mockRestore();
    });

    it('should dispatch to Mixpanel HTTP API when MIXPANEL_TOKEN is configured', async () => {
        process.env.MIXPANEL_TOKEN = 'test-mixpanel-token';
        mockedAxios.post.mockResolvedValue({ status: 200, data: '1' });
        jest.spyOn(prisma.analyticsEvent, 'createMany').mockResolvedValue({ count: 1 });

        await analyticsService.trackEvent('SIGNUP', 'user-99', { role: 'CUSTOMER' });
        await analyticsService.flush();

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.mixpanel.com/track',
            expect.arrayContaining([
                expect.objectContaining({
                    event: 'SIGNUP',
                    properties: expect.objectContaining({
                        token: 'test-mixpanel-token',
                        distinct_id: 'user-99',
                        role: 'CUSTOMER'
                    })
                })
            ]),
            expect.any(Object)
        );
    });

    it('should dispatch to Amplitude HTTP API when AMPLITUDE_API_KEY is configured', async () => {
        process.env.AMPLITUDE_API_KEY = 'test-amplitude-key';
        mockedAxios.post.mockResolvedValue({ status: 200, data: { code: 200 } });
        jest.spyOn(prisma.analyticsEvent, 'createMany').mockResolvedValue({ count: 1 });

        await analyticsService.trackEvent('PURCHASE', 'user-55', { amount: 49.99 });
        await analyticsService.flush();

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api2.amplitude.com/2/httpapi',
            expect.objectContaining({
                api_key: 'test-amplitude-key',
                events: expect.arrayContaining([
                    expect.objectContaining({
                        event_type: 'PURCHASE',
                        user_id: 'user-55',
                        event_properties: expect.objectContaining({ amount: 49.99 })
                    })
                ])
            }),
            expect.any(Object)
        );
    });

    it('should handle flush errors gracefully and re-enqueue events without throwing', async () => {
        jest.spyOn(prisma.analyticsEvent, 'createMany').mockRejectedValue(new Error('Database Connection Failed'));

        await analyticsService.trackEvent('CRITICAL_EVENT', 'user-err');
        expect(analyticsService.getQueueSize()).toBe(1);

        // Should not throw exception to caller
        await expect(analyticsService.flush()).resolves.not.toThrow();

        // Failed event should be re-enqueued for retry
        expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track domain events correctly', async () => {
        const spy = jest.spyOn(analyticsService, 'trackEvent');

        await analyticsService.trackSignup('u-1', 'CUSTOMER', 'google');
        await analyticsService.trackLogin('u-1', 'CUSTOMER');
        await analyticsService.trackCartAddition('u-1', 's-1', 'p-1', 2, 4.99);
        await analyticsService.trackCheckoutStarted('u-1', 'ord-1', 9.98);
        await analyticsService.trackPaymentCompleted('u-1', 'ord-1', 9.98, 'tx-123');
        await analyticsService.trackPaymentFailed('u-1', 'ord-1', 9.98, 'Card declined');

        expect(spy).toHaveBeenCalledWith('CUSTOMER_SIGNUP', 'u-1', { role: 'CUSTOMER', source: 'google' });
        expect(spy).toHaveBeenCalledWith('CUSTOMER_LOGIN', 'u-1', { role: 'CUSTOMER' });
        expect(spy).toHaveBeenCalledWith('CART_ADDITION', 'u-1', { storeId: 's-1', productId: 'p-1', quantity: 2, price: 4.99 });
        expect(spy).toHaveBeenCalledWith('CHECKOUT_STARTED', 'u-1', { orderId: 'ord-1', amount: 9.98 });
        expect(spy).toHaveBeenCalledWith('PAYMENT_COMPLETED', 'u-1', { orderId: 'ord-1', amount: 9.98, transactionId: 'tx-123' });
        expect(spy).toHaveBeenCalledWith('PAYMENT_FAILED', 'u-1', { orderId: 'ord-1', amount: 9.98, errorMsg: 'Card declined' });

        spy.mockRestore();
    });
});
