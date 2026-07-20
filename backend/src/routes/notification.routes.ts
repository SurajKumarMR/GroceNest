
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Retrieve notification history for the authenticated user
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, notificationController.getMyNotifications);

router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @openapi
 * /api/notifications/device-token:
 *   post:
 *     summary: Register a device token for Push Notifications (FCM)
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "fcm_token_xyz_123"
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 example: "ios"
 *     responses:
 *       200:
 *         description: Device token registered successfully
 *       400:
 *         description: Token already registered or validation failed
 *       401:
 *         description: Unauthorized
 */
router.post('/device-token', authenticate, notificationController.registerDeviceToken);

/**
 * @openapi
 * /api/notifications/device-token/{token}:
 *   delete:
 *     summary: Unregister a device token to disable Push Notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The FCM token to unregister
 *     responses:
 *       204:
 *         description: Device token unregistered successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/device-token/:token', authenticate, notificationController.unregisterDeviceToken);

/**
 * @openapi
 * /api/notifications/preferences:
 *   get:
 *     summary: Retrieve user notification preferences across channels (Push, SMS, Email)
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User preference object successfully returned
 *       401:
 *         description: Unauthorized
 */
router.get('/preferences', authenticate, notificationController.getPreferences);

/**
 * @openapi
 * /api/notifications/preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pushEnabled:
 *                 type: boolean
 *               smsEnabled:
 *                 type: boolean
 *               emailEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/preferences', authenticate, notificationController.updatePreferences);

export default router;
