
import { Router } from 'express';
import { getProfile, updateProfile, createAddress, getAddresses, deleteAddress, updateAvatar } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     summary: Retrieve user profile details
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   put:
 *     summary: Update user profile details
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, example: "Jane" }
 *               lastName: { type: string, example: "Doe" }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

/**
 * @openapi
 * /api/users/profile/avatar:
 *   post:
 *     summary: Upload user profile avatar image
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */
router.post('/profile/avatar', authenticate, upload.single('avatar'), updateAvatar);

/**
 * @openapi
 * /api/users/addresses:
 *   post:
 *     summary: Create new delivery address
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [streetAddress, city, postalCode]
 *             properties:
 *               streetAddress: { type: string, example: "10 Downing St" }
 *               city: { type: string, example: "London" }
 *               postalCode: { type: string, example: "SW1A 2AA" }
 *     responses:
 *       201:
 *         description: Address created successfully
 *   get:
 *     summary: List customer delivery addresses
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved addresses
 */
router.post('/addresses', authenticate, createAddress);
router.get('/addresses', authenticate, getAddresses);

/**
 * @openapi
 * /api/users/addresses/{addressId}:
 *   delete:
 *     summary: Delete saved delivery address
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete('/addresses/:addressId', authenticate, deleteAddress);

export default router;
