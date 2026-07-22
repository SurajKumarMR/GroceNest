
import { Router } from 'express';
import { getCart, addToCart, removeFromCart, updateCartItemQuantity } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: Retrieve user's active shopping cart
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart details successfully retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getCart);

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     summary: Add or update an item in the shopping cart
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "prod_123"
 *               productVariantId:
 *                 type: string
 *                 example: "var_456"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added successfully, returns the updated cart
 *       400:
 *         description: Validation failed or product out of stock
 *       401:
 *         description: Unauthorized
 */
router.post('/items', authenticate, addToCart);

/**
 * @openapi
 * /api/cart/items/{itemId}:
 *   delete:
 *     summary: Remove an item from the shopping cart
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the cart item to delete
 *     responses:
 *       204:
 *         description: Item deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/items/:itemId', authenticate, removeFromCart);

/**
 * @openapi
 * /api/cart/items/{itemId}:
 *   put:
 *     summary: Update quantity of an item in the shopping cart
 *     tags:
 *       - Cart
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the cart item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Item quantity updated successfully, returns the updated cart
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
router.put('/items/:itemId', authenticate, updateCartItemQuantity);

export default router;
