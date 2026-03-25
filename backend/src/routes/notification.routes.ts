
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, notificationController.getMyNotifications);
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;
