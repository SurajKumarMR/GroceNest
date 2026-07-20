import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getBusinessMetrics } from '../controllers/analytics.controller';

const router = Router();

/**
 * @openapi
 * /api/analytics/metrics:
 *   get:
 *     summary: Retrieve aggregate business metrics and KPIs
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success, returns KPIs, revenue, AOV, retention, top stores, and recent events feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                     orderVolume:
 *                       type: integer
 *                     averageOrderValue:
 *                       type: number
 *                     totalUsers:
 *                       type: integer
 *                     totalDrivers:
 *                       type: integer
 *                     totalStores:
 *                       type: integer
 *                     customerRetentionRate:
 *                       type: number
 *                     averageDeliveryTimeMinutes:
 *                       type: number
 *                 storePerformance:
 *                   type: array
 *                   items:
 *                     type: object
 *                 recentEvents:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized (Token missing or expired)
 *       403:
 *         description: Forbidden (Non-admin users)
 */
router.get('/metrics', authenticate, authorize(['ADMIN']), getBusinessMetrics);

export default router;
