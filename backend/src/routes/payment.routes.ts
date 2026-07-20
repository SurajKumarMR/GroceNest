
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

export default router;
