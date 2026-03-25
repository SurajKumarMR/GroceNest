
import { Router } from 'express';
import { createOrder, getOrders, cancelOrder, verifyOrderOTP } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.put('/:id/cancel', authenticate, cancelOrder);
router.post('/:id/verify-otp', authenticate, verifyOrderOTP);

export default router;
