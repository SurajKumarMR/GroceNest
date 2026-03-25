
import express, { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

// Regular JSON parser for usual endpoints
router.post('/init', authenticate, paymentController.initPayment);

// Webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

export default router;
