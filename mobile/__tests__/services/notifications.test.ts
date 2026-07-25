import {
    requestNotificationPermission,
    getFCMToken,
    registerFCMToken,
    unregisterFCMToken,
    setupPushNotifications,
} from '../../src/services/notifications';
import api from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

describe('Mobile Notifications Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('requestNotificationPermission returns true', async () => {
        const granted = await requestNotificationPermission();
        expect(granted).toBe(true);
    });

    it('getFCMToken retrieves or generates a device token', async () => {
        const token = await getFCMToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token!.length).toBeGreaterThan(0);
    });

    it('registerFCMToken calls backend API endpoint with token', async () => {
        const token = 'test_mock_fcm_token_123';
        const success = await registerFCMToken(token);

        expect(success).toBe(true);
        expect(api.post).toHaveBeenCalledWith(
            '/users/fcm-token',
            expect.objectContaining({ fcmToken: token, token })
        );
    });

    it('unregisterFCMToken calls backend delete token API endpoint', async () => {
        const token = 'test_mock_fcm_token_123';
        const success = await unregisterFCMToken(token);

        expect(success).toBe(true);
        expect(api.delete).toHaveBeenCalledWith(
            expect.stringContaining('/notifications/device-token/')
        );
    });

    it('setupPushNotifications executes full permission, token, and registration pipeline', async () => {
        const result = await setupPushNotifications();
        expect(result).toBe(true);
        expect(api.post).toHaveBeenCalled();
    });
});
