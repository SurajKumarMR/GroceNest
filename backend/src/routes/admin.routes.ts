
import { Router } from 'express';
import {
    getStats,
    getAllUsers,
    getAllStores,
    toggleUserStatus,
    toggleStoreStatus,
    getNotificationStats,
    getNotificationLogs,
    checkCustomerChurn,
    getAdminAnalyticsOverview
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize(['ADMIN']));

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     summary: Retrieve high-level platform statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin stats retrieved successfully
 */
router.get('/stats', getStats);

/**
 * @openapi
 * /api/admin/analytics/overview:
 *   get:
 *     summary: Retrieve comprehensive executive analytics (Orders, Revenue, Customer Growth, Merchant Performance)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Executive analytics overview retrieved successfully
 */
router.get('/analytics/overview', getAdminAnalyticsOverview);

/**
 * @openapi
 * /api/admin/notifications/stats:
 *   get:
 *     summary: Get notification delivery tracking rates and status counts
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification stats retrieved successfully
 */
router.get('/notifications/stats', getNotificationStats);

/**
 * @openapi
 * /api/admin/notifications/logs:
 *   get:
 *     summary: Query notification delivery attempt logs with filters
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification logs retrieved successfully
 */
router.get('/notifications/logs', getNotificationLogs);

/**
 * @openapi
 * /api/admin/analytics/check-churn:
 *   post:
 *     summary: Trigger customer churn detection (7+ days inactive)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Churn audit completed
 */
router.post('/analytics/check-churn', checkCustomerChurn);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: List all platform users across roles
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of platform users
 */
router.get('/users', getAllUsers);

/**
 * @openapi
 * /api/admin/stores:
 *   get:
 *     summary: List all registered stores for moderation
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of stores
 */
router.get('/stores', getAllStores);

/**
 * @openapi
 * /api/admin/users/{userId}/status:
 *   patch:
 *     summary: Toggle user status (active/suspended)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch('/users/:userId/status', toggleUserStatus);

/**
 * @openapi
 * /api/admin/stores/{storeId}/status:
 *   patch:
 *     summary: Toggle merchant store status (approved/suspended)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Store status updated
 */
router.patch('/stores/:storeId/status', toggleStoreStatus);

export default router;
