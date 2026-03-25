
import { Router } from 'express';
import { createProduct, getProducts, getCategories } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/categories', getCategories);
router.post('/', authenticate, createProduct);
router.get('/', getProducts);

export default router;
