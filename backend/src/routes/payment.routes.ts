
import express, { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @openapi
 * /api/payments/init:
 *   post:
 *     summary: Initialize payment session for an order
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "order_123"
 *     responses:
 *       200:
 *         description: Stripe client secret and paymentIntentId successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                 paymentIntentId:
 *                   type: string
 *       400:
 *         description: Validation failed or order amount mismatch
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/init', authenticate, paymentController.initPayment);

/**
 * @openapi
 * /api/payments/connect/onboard:
 *   post:
 *     summary: Generate a Stripe Connect onboarding link for a store
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *                 example: "store_123"
 *     responses:
 *       200:
 *         description: Stripe Connect onboarding link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found or not owner
 */
router.post('/connect/onboard', authenticate, paymentController.onboardStoreConnect);

/**
 * @openapi
 * /api/payments/connect/callback:
 *   get:
 *     summary: Callback endpoint redirected from Stripe Connect onboarding
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stripe Connect status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "completed"
 *       400:
 *         description: Invalid storeId
 *       404:
 *         description: Store not found
 */
router.get('/connect/callback', paymentController.onboardCallback);

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe asynchronous webhook receiver
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       description: Raw Stripe event payload
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

/**
 * @openapi
 * /api/payments/refund:
 *   post:
 *     summary: Process order refund and dispatch email notification
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/refund', authenticate, paymentController.processRefund);

/**
 * @openapi
 * /api/payments/analytics/financials:
 *   get:
 *     summary: Retrieve platform-wide financial revenue analytics and payment metrics
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Financial analytics metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/financials', authenticate, paymentController.getFinancialAnalytics);

/**
 * @openapi
 * /api/payments/methods:
 *   get:
 *     summary: Retrieve saved payment methods for the authenticated user
 *     tags:
 *       - Payment Methods
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved payment methods
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add a new saved payment method
 *     tags:
 *       - Payment Methods
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               stripePaymentMethodId:
 *                 type: string
 *               cardBrand:
 *                 type: string
 *               cardLastFour:
 *                 type: string
 *               cardExpMonth:
 *                 type: integer
 *               cardExpYear:
 *                 type: integer
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Payment method added successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/methods', authenticate, paymentController.getPaymentMethods);
router.post('/methods', authenticate, paymentController.addPaymentMethod);

/**
 * @openapi
 * /api/payments/methods/{id}:
 *   delete:
 *     summary: Delete a saved payment method
 *     tags:
 *       - Payment Methods
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *       404:
 *         description: Payment method not found
 */
router.delete('/methods/:id', authenticate, paymentController.deletePaymentMethod);

/**
 * @openapi
 * /api/payments/methods/{id}/default:
 *   patch:
 *     summary: Set a saved payment method as default
 *     tags:
 *       - Payment Methods
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default payment method updated successfully
 *       404:
 *         description: Payment method not found
 */
router.patch('/methods/:id/default', authenticate, paymentController.setDefaultPaymentMethod);

export default router;
