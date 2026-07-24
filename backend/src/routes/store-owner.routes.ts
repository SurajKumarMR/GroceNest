
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
    getMyStore, 
    getStoreOrders, 
    updateOrderStatus, 
    updateStore, 
    createProduct, 
    deleteProduct, 
    updateProduct, 
    uploadProductImage,
    getStoreRevenueAnalytics,
    triggerMerchantPayout
} from '../controllers/store-owner.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication and MERCHANT role
router.use(authenticate);
router.use(authorize(['MERCHANT', 'ADMIN']));

/**
 * @openapi
 * /api/owner/my-store:
 *   get:
 *     summary: Retrieve merchant store details
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Store not found for current merchant
 *   put:
 *     summary: Update merchant store details
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Fresh Organic Grocery" }
 *               streetAddress: { type: string, example: "123 High St" }
 *               city: { type: string, example: "London" }
 *               postalCode: { type: string, example: "EC1A 1BB" }
 *     responses:
 *       200:
 *         description: Store updated successfully
 */
router.get('/my-store', getMyStore);
router.put('/my-store', updateStore);

/**
 * @openapi
 * /api/owner/orders:
 *   get:
 *     summary: List all orders for the merchant store
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of store orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/orders', getStoreOrders);

/**
 * @openapi
 * /api/owner/orders/{orderId}/status:
 *   put:
 *     summary: Update store order status (e.g. CONFIRMED, PREPARING, READY)
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, PREPARING, READY, CANCELLED]
 *                 example: "CONFIRMED"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.put('/orders/:orderId/status', updateOrderStatus);

/**
 * @openapi
 * /api/owner/analytics/revenue:
 *   get:
 *     summary: Get merchant revenue analytics, commission, and daily breakdown
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Revenue metrics computed successfully
 */
router.get('/analytics/revenue', getStoreRevenueAnalytics);

/**
 * @openapi
 * /api/owner/payouts:
 *   post:
 *     summary: Trigger manual merchant payout request
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payout triggered successfully
 */
router.post('/payouts', triggerMerchantPayout);

/**
 * @openapi
 * /api/owner/products:
 *   post:
 *     summary: Create new product in merchant store
 *     tags: [Merchant]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, category]
 *             properties:
 *               name: { type: string, example: "Organic Milk 2L" }
 *               price: { type: number, example: 2.49 }
 *               category: { type: string, example: "Dairy" }
 *               stockQuantity: { type: integer, example: 50 }
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/products', createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);
router.post('/products/:productId/image', upload.single('product'), uploadProductImage);

export default router;
