
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as reviewController from '../controllers/review.controller';

const router = Router();

/**
 * @openapi
 * /api/reviews:
 *   post:
 *     summary: Create order/store review and rating
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storeId, rating]
 *             properties:
 *               storeId: { type: string, example: "str_67890" }
 *               productId: { type: string, example: "prd_11223" }
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comment: { type: string, example: "Fresh produce and super fast delivery!" }
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * @openapi
 * /api/reviews/store/{storeId}:
 *   get:
 *     summary: Retrieve store reviews and rating breakdown
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of store reviews
 */
router.get('/store/:storeId', reviewController.getStoreReviews);

/**
 * @openapi
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Retrieve product reviews and ratings
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of product reviews
 */
router.get('/product/:productId', reviewController.getProductReviews);

export default router;
