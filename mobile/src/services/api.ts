
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2. For iOS or real device, use your local IP.
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const storeApi = {
    getStores: (q?: string) => api.get(`/stores${q ? `?q=${q}` : ''}`),
    getStoreBySlug: (slug: string) => api.get(`/stores/${slug}`),
};

export const productApi = {
    getProducts: (q?: string) => api.get(`/products${q ? `?q=${q}` : ''}`),
    getProductsByStore: (storeId: string) => api.get(`/products?storeId=${storeId}`),
    getProductBySlug: (slug: string) => api.get(`/products/${slug}`),
};

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

export const orderApi = {
    getOrders: () => api.get('/orders'),
    placeOrder: (orderData: any) => api.post('/orders', orderData),
};

export default api;
