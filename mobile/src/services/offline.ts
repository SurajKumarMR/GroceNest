import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const CACHE_PREFIX = '@grocenest_cache:';
const OFFLINE_QUEUE_KEY = '@grocenest_offline_queue';

export interface QueuedRequest {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    payload?: any;
    timestamp: number;
}

/**
 * Cache JSON data in AsyncStorage with timestamp tag.
 */
export async function cacheData(key: string, data: any): Promise<boolean> {
    try {
        const payload = JSON.stringify({
            timestamp: Date.now(),
            data,
        });
        await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
        return true;
    } catch (error) {
        console.warn(`[Offline] Error caching data for key '${key}':`, error);
        return false;
    }
}

/**
 * Retrieve cached JSON data from AsyncStorage.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.data as T;
    } catch (error) {
        console.warn(`[Offline] Error reading cached data for key '${key}':`, error);
        return null;
    }
}

// ── Specific Caching Helpers ───────────────────────────────────────

export const cacheOrders = (orders: any[]) => cacheData('orders', orders);
export const getCachedOrders = () => getCachedData<any[]>('orders');

export const cacheProducts = (products: any[]) => cacheData('products', products);
export const getCachedProducts = () => getCachedData<any[]>('products');

export const cacheStores = (stores: any[]) => cacheData('stores', stores);
export const getCachedStores = () => getCachedData<any[]>('stores');

export const cacheUserData = (user: any) => cacheData('user', user);
export const getCachedUserData = () => getCachedData<any>('user');

// ── Offline Request Queue Management ───────────────────────────────

/**
 * Queue a mutation request to be executed when network connectivity is restored.
 */
export async function queueOfflineRequest(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    payload?: any
): Promise<QueuedRequest> {
    const queue = await getOfflineQueue();
    const newRequest: QueuedRequest = {
        id: `offline_req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        url,
        method,
        payload,
        timestamp: Date.now(),
    };

    queue.push(newRequest);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[Offline] Request queued: ${method} ${url} (Queue size: ${queue.length})`);
    return newRequest;
}

/**
 * Get all pending offline requests from storage.
 */
export async function getOfflineQueue(): Promise<QueuedRequest[]> {
    try {
        const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (error) {
        console.warn('[Offline] Error reading offline queue:', error);
        return [];
    }
}

/**
 * Clear all pending requests from the offline queue.
 */
export async function clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

/**
 * Drain and synchronize the offline queue with the backend.
 * Re-executes queued requests sequentially in FIFO order.
 */
export async function syncOfflineQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
        return { syncedCount: 0, failedCount: 0 };
    }

    console.log(`[Offline] Starting sync for ${queue.length} queued requests...`);
    let syncedCount = 0;
    let failedCount = 0;
    const remainingQueue: QueuedRequest[] = [];

    for (const req of queue) {
        try {
            switch (req.method) {
                case 'POST':
                    await api.post(req.url, req.payload);
                    break;
                case 'PUT':
                    await api.put(req.url, req.payload);
                    break;
                case 'PATCH':
                    await api.patch(req.url, req.payload);
                    break;
                case 'DELETE':
                    await api.delete(req.url);
                    break;
            }
            syncedCount++;
            console.log(`[Offline] Successfully synced request: ${req.method} ${req.url}`);
        } catch (error: any) {
            console.error(`[Offline] Failed to sync request ${req.method} ${req.url}:`, error.message || error);
            // If it's a network error, keep in queue for next retry
            if (!error.response || error.code === 'ERR_NETWORK') {
                remainingQueue.push(req);
            }
            failedCount++;
        }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    return { syncedCount, failedCount };
}
