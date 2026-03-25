
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as reviewController from '../controllers/review.controller';

const router = Router();

router.post('/', authenticate, reviewController.createReview);
router.get('/store/:storeId', reviewController.getStoreReviews);
router.get('/product/:productId', reviewController.getProductReviews);

export default router;
