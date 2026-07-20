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

// ── Response interceptor: clear session on 401 ────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — wipe local session
            await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
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
