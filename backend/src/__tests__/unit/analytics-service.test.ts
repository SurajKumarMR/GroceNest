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

    it('should overflow queue when MAX_QUEUE_SIZE (1000) is exceeded', async () => {
        for (let i = 0; i < 1005; i++) {
            await analyticsService.trackEvent(`EVENT_${i}`, 'user-1');
        }
        expect(analyticsService.getQueueSize()).toBe(1000);
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

    it('should handle Mixpanel dispatch failure gracefully', async () => {
        process.env.MIXPANEL_TOKEN = 'test-mixpanel-token';
        mockedAxios.post.mockRejectedValue(new Error('Mixpanel timeout'));
        jest.spyOn(prisma.analyticsEvent, 'createMany').mockResolvedValue({ count: 1 });

        await analyticsService.trackEvent('EVENT_MIX_ERR', 'user-1');
        await expect(analyticsService.flush()).resolves.not.toThrow();
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

    it('should handle Amplitude dispatch failure gracefully', async () => {
        process.env.AMPLITUDE_API_KEY = 'test-amplitude-key';
        mockedAxios.post.mockRejectedValue(new Error('Amplitude network error'));
        jest.spyOn(prisma.analyticsEvent, 'createMany').mockResolvedValue({ count: 1 });

        await analyticsService.trackEvent('EVENT_AMP_ERR', 'user-1');
        await expect(analyticsService.flush()).resolves.not.toThrow();
    });

    it('should handle flush errors gracefully and re-enqueue events without throwing', async () => {
        jest.spyOn(prisma.analyticsEvent, 'createMany').mockRejectedValue(new Error('Database Connection Failed'));

        await analyticsService.trackEvent('CRITICAL_EVENT', 'user-err');
        expect(analyticsService.getQueueSize()).toBe(1);

        await expect(analyticsService.flush()).resolves.not.toThrow();
        expect(analyticsService.getQueueSize()).toBe(1);
    });

    it('should track order placement lifecycle (first order vs repeat order)', async () => {
        const countSpy = jest.spyOn(prisma.order, 'count');
        const trackSpy = jest.spyOn(analyticsService, 'trackEvent');

        // Case 1: First order (prior count = 0)
        countSpy.mockResolvedValueOnce(0);
        await analyticsService.trackOrderPlaced('user-first', 'ord-101', 25.50);
        expect(trackSpy).toHaveBeenCalledWith('CUSTOMER_FIRST_ORDER', 'user-first', { orderId: 'ord-101', amount: 25.50 });

        // Case 2: Repeat order (prior count = 2)
        countSpy.mockResolvedValueOnce(2);
        await analyticsService.trackOrderPlaced('user-repeat', 'ord-102', 40.00);
        expect(trackSpy).toHaveBeenCalledWith('CUSTOMER_REPEAT_ORDER', 'user-repeat', { orderId: 'ord-102', amount: 40.00, orderCount: 3 });

        // Case 3: Exception fallback
        countSpy.mockRejectedValueOnce(new Error('DB Error'));
        await analyticsService.trackOrderPlaced('user-err', 'ord-103', 10.00);
        expect(trackSpy).toHaveBeenCalledWith('ORDER_PLACED', 'user-err', { orderId: 'ord-103', amount: 10.00 });

        countSpy.mockRestore();
        trackSpy.mockRestore();
    });

    it('should detect and track churned customers', async () => {
        const findManyUsersSpy = jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
            {
                id: 'churned-1',
                createdAt: new Date('2026-01-01'),
                orders: [{ placedAt: new Date('2026-01-02') }]
            }
        ] as any);
        const findFirstEventSpy = jest.spyOn(prisma.analyticsEvent, 'findFirst').mockResolvedValue(null);
        const trackSpy = jest.spyOn(analyticsService, 'trackEvent');

        const churnedIds = await analyticsService.detectAndTrackChurnedCustomers();
        expect(churnedIds).toContain('churned-1');
        expect(trackSpy).toHaveBeenCalledWith('CUSTOMER_CHURNED', 'churned-1', expect.any(Object));

        findManyUsersSpy.mockRestore();
        findFirstEventSpy.mockRestore();
        trackSpy.mockRestore();
    });

    it('should calculate merchant revenue metrics', async () => {
        const findManyOrdersSpy = jest.spyOn(prisma.order, 'findMany').mockResolvedValue([
            { id: 'ord-1', totalAmount: 100, placedAt: new Date('2026-07-20T10:00:00Z') },
            { id: 'ord-2', totalAmount: 50, placedAt: new Date('2026-07-20T14:00:00Z') }
        ] as any);

        const metrics = await analyticsService.getMerchantRevenueMetrics('store-123', 30);
        expect(metrics.totalGrossSales).toBe(150);
        expect(metrics.platformFee).toBe(15);
        expect(metrics.totalNetPayout).toBe(135);
        expect(metrics.totalOrderCount).toBe(2);
        expect(metrics.averageOrderValue).toBe(75);
        expect(metrics.dailySales.length).toBe(1);

        findManyOrdersSpy.mockRestore();
    });

    it('should calculate driver performance metrics', async () => {
        const findManyDeliveredSpy = jest.spyOn(prisma.order, 'findMany').mockResolvedValue([
            { id: 'ord-1', deliveryFee: 5, tipAmount: 2, deliveredAt: new Date('2026-07-21T12:00:00Z') }
        ] as any);
        const findManyRatingsSpy = jest.spyOn(prisma.analyticsEvent, 'findMany').mockResolvedValue([
            { userId: 'driver-1', eventName: 'DRIVER_RATED', properties: { rating: 5 } }
        ] as any);
        const countShiftsSpy = jest.spyOn(prisma.analyticsEvent, 'count').mockResolvedValue(3);

        const metrics = await analyticsService.getDriverPerformanceMetrics('driver-1', 30);
        expect(metrics.totalCompletedDeliveries).toBe(1);
        expect(metrics.totalDeliveryFees).toBe(5);
        expect(metrics.totalTips).toBe(2);
        expect(metrics.totalEarnings).toBe(7);
        expect(metrics.averageRating).toBe(5);
        expect(metrics.completedShiftsCount).toBe(3);

        findManyDeliveredSpy.mockRestore();
        findManyRatingsSpy.mockRestore();
        countShiftsSpy.mockRestore();
    });

    it('should calculate financial analytics metrics', async () => {
        const findManyPaidOrdersSpy = jest.spyOn(prisma.order, 'findMany').mockResolvedValue([
            { id: 'ord-1', totalAmount: 200, paymentStatus: 'paid', placedAt: new Date('2026-07-22T08:00:00Z') }
        ] as any);
        const findManyEventsSpy = jest.spyOn(prisma.analyticsEvent, 'findMany')
            .mockResolvedValueOnce([{ id: 'ev-1' }] as any) // PAYMENT_COMPLETED
            .mockResolvedValueOnce([]) // PAYMENT_FAILED
            .mockResolvedValueOnce([]); // PAYMENT_REFUNDED

        const metrics = await analyticsService.getFinancialAnalyticsMetrics(30);
        expect(metrics.totalGrossRevenue).toBe(200);
        expect(metrics.totalRefunds).toBe(0);
        expect(metrics.totalNetRevenue).toBe(200);
        expect(metrics.platformCommissionEarned).toBe(20);
        expect(metrics.paymentSuccessRate).toBe(100);

        findManyPaidOrdersSpy.mockRestore();
        findManyEventsSpy.mockRestore();
    });

    it('should track merchant, driver, and payment events correctly', async () => {
        const spy = jest.spyOn(analyticsService, 'trackEvent');

        await analyticsService.trackStoreCreated('user-m', 's-1', 'My Store');
        await analyticsService.trackOrderAccepted('s-1', 'owner-1', 'ord-1', 'ORD001', 50);
        await analyticsService.trackMerchantPayout('s-1', 'owner-1', 100, 'pay-1', 'completed');
        await analyticsService.trackProductUpdated('user-m', 's-1', 'p-1', 'Fresh Apples');
        await analyticsService.trackDriverLocationUpdate('d-1', 40.7128, -74.0060, 5);
        await analyticsService.trackDriverShiftStart('d-1');
        await analyticsService.trackDriverShiftEnd('d-1', 480);
        await analyticsService.trackDriverDeliveryCompleted('d-1', 'ord-1', 5, 2);
        await analyticsService.trackDriverRating('d-1', 'ord-1', 5, 'Great job!');
        await analyticsService.trackPaymentRefunded('u-1', 'ord-1', 50, 'Defective item');

        expect(spy).toHaveBeenCalledWith('STORE_CREATED', 'user-m', { storeId: 's-1', storeName: 'My Store' });
        expect(spy).toHaveBeenCalledWith('MERCHANT_ORDER_ACCEPTED', 'owner-1', { storeId: 's-1', orderId: 'ord-1', orderNumber: 'ORD001', amount: 50 });
        expect(spy).toHaveBeenCalledWith('PRODUCT_UPDATED', 'user-m', { storeId: 's-1', productId: 'p-1', name: 'Fresh Apples' });
        expect(spy).toHaveBeenCalledWith('DRIVER_SHIFT_STARTED', 'd-1', expect.any(Object));
        expect(spy).toHaveBeenCalledWith('PAYMENT_REFUNDED', 'u-1', { orderId: 'ord-1', refundAmount: 50, reason: 'Defective item' });

        spy.mockRestore();
    });
});
