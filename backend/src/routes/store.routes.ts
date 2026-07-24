
import { Router } from 'express';
import { createStore, getStores, getStoreBySlug, updateStoreLogo, updateStoreCover } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

/**
 * @openapi
 * /api/stores:
 *   post:
 *     summary: Create a new grocery store
 *     tags: [Stores]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       201:
 *         description: Store created successfully
 *   get:
 *     summary: Discover nearby grocery stores
 *     tags: [Stores]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number, example: 51.5074 }
 *       - in: query
 *         name: lng
 *         schema: { type: number, example: -0.1278 }
 *       - in: query
 *         name: radius
 *         schema: { type: number, example: 10 }
 *     responses:
 *       200:
 *         description: List of nearby active stores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Store'
 */
router.post('/', authenticate, createStore);
router.get('/', getStores);

/**
 * @openapi
 * /api/stores/{slug}:
 *   get:
 *     summary: Get store details by unique slug
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string, example: "fresh-organic-grocery" }
 *     responses:
 *       200:
 *         description: Store details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Store'
 */
router.get('/:slug', getStoreBySlug);

/**
 * @openapi
 * /api/stores/{storeId}/logo:
 *   post:
 *     summary: Upload store logo image
 *     tags: [Stores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Store logo updated successfully
 */
router.post('/:storeId/logo', authenticate, upload.single('logo'), updateStoreLogo);

/**
 * @openapi
 * /api/stores/{storeId}/cover:
 *   post:
 *     summary: Upload store cover banner image
 *     tags: [Stores]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Store cover image updated successfully
 */
router.post('/:storeId/cover', authenticate, upload.single('cover'), updateStoreCover);

export default router;
