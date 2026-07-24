import { Router } from 'express';
import { submitFeedback, getFeedbacks, getChatHistory } from '../controllers/support.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/support/feedback:
 *   post:
 *     summary: Submit customer support feedback or ticket
 *     tags: [Support]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: "Need help with my order delivery status." }
 *               category: { type: string, example: "delivery" }
 *     responses:
 *       201:
 *         description: Support feedback submitted successfully
 *   get:
 *     summary: Admin list support feedbacks
 *     tags: [Support]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of support tickets
 */
router.post('/feedback', authenticate, submitFeedback);
router.get('/feedback', authenticate, authorize(['ADMIN']), getFeedbacks);

/**
 * @openapi
 * /api/support/chat/history:
 *   get:
 *     summary: Retrieve support live chat history
 *     tags: [Support]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history log
 */
router.get('/chat/history', authenticate, getChatHistory);

export default router;
