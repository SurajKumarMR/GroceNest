import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { API_URL } from '@env';

const BASE_URL = API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Request interceptor: attach JWT ────────────────────────────────
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: clear session on 401 & handle offline cache ─────
api.interceptors.response.use(
    async (response) => {
        // Automatically cache successful GET responses for core entities
        if (response.config.method?.toLowerCase() === 'get' && response.data) {
            const url = response.config.url || '';
            const { cacheData } = require('./offline');
            if (url.includes('/orders')) {
                await cacheData('orders', response.data);
            } else if (url.includes('/products')) {
                await cacheData('products', response.data);
            } else if (url.includes('/stores')) {
                await cacheData('stores', response.data);
            } else if (url.includes('/users/profile')) {
                await cacheData('user', response.data);
            }
        }
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — wipe local session
            await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        }

        // Handle network connection failure offline fallback
        const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
        if (isNetworkError && error.config) {
            const method = error.config.method?.toLowerCase();
            const url = error.config.url || '';
            const { getCachedData } = require('./offline');

            if (method === 'get') {
                if (url.includes('/orders')) {
                    const cached = await getCachedData('orders');
                    if (cached) return { data: cached, status: 200, headers: {}, config: error.config, statusText: 'OK (Cached)' };
                } else if (url.includes('/products')) {
                    const cached = await getCachedData('products');
                    if (cached) return { data: cached, status: 200, headers: {}, config: error.config, statusText: 'OK (Cached)' };
                } else if (url.includes('/stores')) {
                    const cached = await getCachedData('stores');
                    if (cached) return { data: cached, status: 200, headers: {}, config: error.config, statusText: 'OK (Cached)' };
                } else if (url.includes('/users/profile')) {
                    const cached = await getCachedData('user');
                    if (cached) return { data: cached, status: 200, headers: {}, config: error.config, statusText: 'OK (Cached)' };
                }
            }
        }

        return Promise.reject(error);
    }
);

// ── Auth API ───────────────────────────────────────────────────────
export const authApi = {
    /** Sign in with email + password */
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    /** Register a new account */
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role?: string;
    }) => api.post('/auth/register', data),

    /** Google OAuth login / register */
    googleLogin: (data: {
        googleId?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
    }) => api.post('/auth/google-login', data),

    /** Send forgot-password email */
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),

    /** Reset password with token from email */
    resetPassword: (token: string, newPassword: string) =>
        api.post('/auth/reset-password', { token, newPassword }),

    /** Rotate access token using stored refresh token */
    refreshToken: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }),

    /** Revoke refresh token on logout */
    logout: (refreshToken?: string) =>
        api.post('/auth/logout', { refreshToken }),

    /** Verify phone OTP after registration */
    verifyPhone: (code: string) =>
        api.post('/auth/verify-phone', { code }),

    /** Verify MFA OTP during login */
    verifyMFA: (mfaToken: string, otpToken: string) =>
        api.post('/auth/mfa/verify', { mfaToken, otpToken }),
};

// ── Store API ──────────────────────────────────────────────────────
export const storeApi = {
    getStores: (q?: string) => api.get(`/stores${q ? `?q=${q}` : ''}`),
    getStoreBySlug: (slug: string) => api.get(`/stores/${slug}`),
};

// ── Product API ────────────────────────────────────────────────────
export const productApi = {
    getProducts: (q?: string) => api.get(`/products${q ? `?q=${q}` : ''}`),
    getProductsByStore: (storeId: string) => api.get(`/products?storeId=${storeId}`),
    getProductBySlug: (slug: string) => api.get(`/products/${slug}`),
};

// ── Cart API ───────────────────────────────────────────────────────
export const cartApi = {
    getCart: () => api.get('/cart'),
    addToCart: (productId: string, quantity: number, storeId: string) =>
        api.post('/cart/items', { productId, quantity, storeId }),
    updateItem: (itemId: string, quantity: number) =>
        api.put(`/cart/items/${itemId}`, { quantity }),
    removeItem: (itemId: string) =>
        api.delete(`/cart/items/${itemId}`),
    clearCart: () => api.delete('/cart'),
};

// ── Order API ──────────────────────────────────────────────────────
export const orderApi = {
    getOrders: () => api.get('/orders'),
    placeOrder: (orderData: any) => api.post('/orders', orderData),
};

export default api;
