
import { Router } from 'express';
import {
    getStats,
    getAllUsers,
    getAllStores,
    toggleUserStatus,
    toggleStoreStatus,
    getNotificationStats,
    getNotificationLogs,
    checkCustomerChurn
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/stats', getStats);
router.get('/notifications/stats', getNotificationStats);
router.get('/notifications/logs', getNotificationLogs);
router.post('/analytics/check-churn', checkCustomerChurn);
router.get('/users', getAllUsers);
router.get('/stores', getAllStores);
router.patch('/users/:userId/status', toggleUserStatus);
router.patch('/stores/:storeId/status', toggleStoreStatus);

export default router;
