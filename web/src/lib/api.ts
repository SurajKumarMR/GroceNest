import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Do not retry refresh or login requests to prevent infinite loops
            if (
                originalRequest.url?.includes('/auth/refresh') ||
                originalRequest.url?.includes('/auth/login')
            ) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
            if (!refreshToken) {
                isRefreshing = false;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            try {
                // Call refresh endpoint with baseURL explicitly
                const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                const { data } = await axios.post(`${baseURL}/auth/refresh`, {
                    refreshToken,
                });

                const newToken = data.token;
                const newRefreshToken = data.refreshToken;

                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', newToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }
                }

                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                isRefreshing = false;

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
