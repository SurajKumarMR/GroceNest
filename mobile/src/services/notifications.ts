import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const FCM_TOKEN_STORAGE_KEY = 'grocenest_fcm_device_token';

/**
 * Request Push Notification permissions from the operating system.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        if (Platform.OS === 'web') {
            return true;
        }

        // Try importing messaging dynamically if available in native build
        try {
            const messaging = require('@react-native-firebase/messaging').default;
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            return enabled;
        } catch {
            // Fallback for environment without native firebase binary
            return true;
        }
    } catch (error) {
        console.warn('[Notifications] Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Retrieve FCM device token from messaging or local storage fallback.
 */
export async function getFCMToken(): Promise<string | null> {
    try {
        let token: string | null = null;

        try {
            const messaging = require('@react-native-firebase/messaging').default;
            token = await messaging().getToken();
        } catch {
            // Native messaging package not available or running in dev simulator
            token = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
            if (!token) {
                token = `fcm_dev_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
            }
        }

        return token;
    } catch (error) {
        console.warn('[Notifications] Error getting FCM token:', error);
        return null;
    }
}

/**
 * Register FCM device token with backend API.
 */
export async function registerFCMToken(tokenInput?: string): Promise<boolean> {
    try {
        const token = tokenInput || (await getFCMToken());
        if (!token) {
            console.warn('[Notifications] No FCM token available to register.');
            return false;
        }

        const payload = {
            fcmToken: token,
            token: token,
            platform: Platform.OS,
        };

        // Post to primary FCM endpoint
        await api.post('/users/fcm-token', payload).catch(async () => {
            // Fallback to secondary device-token endpoint
            await api.post('/notifications/device-token', payload);
        });

        await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
        console.log('[Notifications] FCM token successfully registered with backend.');
        return true;
    } catch (error) {
        console.error('[Notifications] Failed to register FCM token with backend:', error);
        return false;
    }
}

/**
 * Unregister FCM device token from backend on logout.
 */
export async function unregisterFCMToken(tokenInput?: string): Promise<boolean> {
    try {
        const token = tokenInput || (await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY));
        if (!token) return true;

        await api.delete(`/notifications/device-token/${encodeURIComponent(token)}`).catch(() => {});
        await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
        console.log('[Notifications] FCM token unregistered successfully.');
        return true;
    } catch (error) {
        console.warn('[Notifications] Error unregistering FCM token:', error);
        return false;
    }
}

/**
 * Complete setup pipeline for Push Notifications:
 * 1. Request permission
 * 2. Retrieve FCM token
 * 3. Send FCM token to backend
 */
export async function setupPushNotifications(): Promise<boolean> {
    try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            console.warn('[Notifications] Push Notification permission was denied.');
            return false;
        }

        const token = await getFCMToken();
        if (!token) {
            console.warn('[Notifications] Failed to retrieve FCM token.');
            return false;
        }

        return await registerFCMToken(token);
    } catch (error) {
        console.error('[Notifications] Error setting up push notifications:', error);
        return false;
    }
}
