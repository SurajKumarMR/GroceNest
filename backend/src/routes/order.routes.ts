
import { Router } from 'express';
import { createOrder, getOrders, cancelOrder, verifyOrderOTP } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a new customer order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storeId, items, deliveryAddress]
 *             properties:
 *               storeId: { type: string, example: "str_67890" }
 *               deliveryAddress: { type: string, example: "123 Main St, London" }
 *               tipAmount: { type: number, example: 2.00 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string, example: "prd_11223" }
 *                     quantity: { type: integer, example: 2 }
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *   get:
 *     summary: Retrieve customer order history
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an existing order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.put('/:id/cancel', authenticate, cancelOrder);

/**
 * @openapi
 * /api/orders/{id}/verify-otp:
 *   post:
 *     summary: Verify 4-digit delivery pin OTP upon order arrival
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp: { type: string, example: "1234" }
 *     responses:
 *       200:
 *         description: OTP verified and order delivered
 */
router.post('/:id/verify-otp', authenticate, verifyOrderOTP);

export default router;
