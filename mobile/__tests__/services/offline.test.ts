import {
    cacheData,
    getCachedData,
    cacheOrders,
    getCachedOrders,
    cacheProducts,
    getCachedProducts,
    cacheStores,
    getCachedStores,
    cacheUserData,
    getCachedUserData,
    queueOfflineRequest,
    getOfflineQueue,
    clearOfflineQueue,
    syncOfflineQueue,
} from '../../src/services/offline';
import api from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../src/services/api', () => ({
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
}));

describe('Mobile Offline Service Unit Tests', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });

    describe('Data Caching & Retrieval', () => {
        it('caches and retrieves arbitrary data by key', async () => {
            const data = { id: 1, name: 'Fresh Apples' };
            const cachedSuccess = await cacheData('test_item', data);
            expect(cachedSuccess).toBe(true);

            const retrieved = await getCachedData<typeof data>('test_item');
            expect(retrieved).toEqual(data);
        });

        it('caches and retrieves orders, products, stores, and user profile data using entity helpers', async () => {
            const mockOrders = [{ id: 'order_1', totalAmount: 25.50 }];
            const mockProducts = [{ id: 'prod_1', name: 'Organic Milk' }];
            const mockStores = [{ id: 'store_1', name: 'Green Grocery' }];
            const mockUser = { id: 'user_1', email: 'user@example.com' };

            await cacheOrders(mockOrders);
            await cacheProducts(mockProducts);
            await cacheStores(mockStores);
            await cacheUserData(mockUser);

            expect(await getCachedOrders()).toEqual(mockOrders);
            expect(await getCachedProducts()).toEqual(mockProducts);
            expect(await getCachedStores()).toEqual(mockStores);
            expect(await getCachedUserData()).toEqual(mockUser);
        });

        it('returns null when requesting non-existent cache key', async () => {
            const res = await getCachedData('non_existent_key');
            expect(res).toBeNull();
        });
    });

    describe('Offline Request Queueing & Sync', () => {
        it('queues offline requests and retrieves pending queue', async () => {
            await clearOfflineQueue();

            const req1 = await queueOfflineRequest('/orders', 'POST', { items: ['p1'] });
            const req2 = await queueOfflineRequest('/cart/items', 'POST', { productId: 'p2' });

            expect(req1.url).toBe('/orders');
            expect(req2.url).toBe('/cart/items');

            const queue = await getOfflineQueue();
            expect(queue.length).toBe(2);
            expect(queue[0].url).toBe('/orders');
            expect(queue[1].url).toBe('/cart/items');
        });

        it('syncOfflineQueue drains and executes queued requests in FIFO sequence', async () => {
            (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

            await clearOfflineQueue();
            await queueOfflineRequest('/orders', 'POST', { total: 45.00 });

            const result = await syncOfflineQueue();
            expect(result.syncedCount).toBe(1);
            expect(result.failedCount).toBe(0);

            expect(api.post).toHaveBeenCalledWith('/orders', { total: 45.00 });

            const remaining = await getOfflineQueue();
            expect(remaining.length).toBe(0);
        });

        it('clears offline queue when clearOfflineQueue is invoked', async () => {
            await queueOfflineRequest('/test', 'POST', {});
            await clearOfflineQueue();
            const queue = await getOfflineQueue();
            expect(queue.length).toBe(0);
        });
    });
});
