
import { Router } from 'express';
import { getCart, addToCart, removeFromCart } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getCart);
router.post('/items', authenticate, addToCart);
router.delete('/items/:itemId', authenticate, removeFromCart);

export default router;
