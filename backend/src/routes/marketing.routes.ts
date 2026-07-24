import { Router } from 'express';
import { joinWaitlist, getWaitlist } from '../controllers/marketing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/marketing/waitlist:
 *   post:
 *     summary: Join marketing / launch waitlist
 *     tags: [Marketing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *     responses:
 *       201:
 *         description: Joined waitlist successfully
 *   get:
 *     summary: Admin list waitlist subscribers
 *     tags: [Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of waitlist entries
 */
router.post('/waitlist', joinWaitlist);
router.get('/waitlist', authenticate, authorize(['ADMIN']), getWaitlist);

export default router;
