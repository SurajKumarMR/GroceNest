
import { Router } from 'express';
import { createProduct, getProducts, getCategories } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/products/categories:
 *   get:
 *     summary: Retrieve available product categories
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: string, example: "Dairy" }
 */
router.get('/categories', getCategories);

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create product entry
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *   get:
 *     summary: Get products catalog with filtering and search
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of products matching filters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.post('/', authenticate, createProduct);
router.get('/', getProducts);

export default router;
