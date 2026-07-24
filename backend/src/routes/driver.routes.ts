
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
    getAvailableOrders, 
    acceptOrder, 
    deliverOrder, 
    getMyDeliveries, 
    uploadLicense, 
    uploadInsurance,
    startShift,
    endShift,
    rateDriver,
    getDriverPerformanceAnalytics
} from '../controllers/driver.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['DRIVER', 'ADMIN']));

/**
 * @openapi
 * /api/driver/available:
 *   get:
 *     summary: Retrieve available orders ready for driver pickup
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of available orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/available', getAvailableOrders);

/**
 * @openapi
 * /api/driver/orders/{orderId}/accept:
 *   post:
 *     summary: Driver accepts an available order for delivery
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order accepted successfully
 */
router.post('/orders/:orderId/accept', acceptOrder);

/**
 * @openapi
 * /api/driver/orders/{orderId}/deliver:
 *   post:
 *     summary: Mark an order as delivered by the driver
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order delivered successfully
 */
router.post('/orders/:orderId/deliver', deliverOrder);

/**
 * @openapi
 * /api/driver/my-deliveries:
 *   get:
 *     summary: Retrieve driver's delivery history and active assignments
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of driver deliveries
 */
router.get('/my-deliveries', getMyDeliveries);

/**
 * @openapi
 * /api/driver/upload-license:
 *   post:
 *     summary: Upload driver driving license document
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: License uploaded successfully
 */
router.post('/upload-license', uploadLicense);

/**
 * @openapi
 * /api/driver/upload-insurance:
 *   post:
 *     summary: Upload driver vehicle insurance document
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Insurance uploaded successfully
 */
router.post('/upload-insurance', uploadInsurance);

/**
 * @openapi
 * /api/driver/shift/start:
 *   post:
 *     summary: Start driver working shift
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Driver shift started
 */
router.post('/shift/start', startShift);

/**
 * @openapi
 * /api/driver/shift/end:
 *   post:
 *     summary: End driver working shift
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMinutes: { type: integer, example: 120 }
 *     responses:
 *       200:
 *         description: Driver shift ended
 */
router.post('/shift/end', endShift);

/**
 * @openapi
 * /api/driver/orders/{orderId}/rate:
 *   post:
 *     summary: Rate assigned driver for a completed delivery
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               feedback: { type: string, example: "Prompt delivery!" }
 *     responses:
 *       200:
 *         description: Driver rated successfully
 */
router.post('/orders/:orderId/rate', rateDriver);

/**
 * @openapi
 * /api/driver/analytics/performance:
 *   get:
 *     summary: Get driver earnings, delivery counts, ratings, and shift performance metrics
 *     tags: [Driver]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Driver performance metrics retrieved successfully
 */
router.get('/analytics/performance', getDriverPerformanceAnalytics);

export default router;
