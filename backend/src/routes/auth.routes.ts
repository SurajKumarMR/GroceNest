
import { Router } from 'express';
import { register, login, refresh, logout, setupMFA, verifyAndEnableMFA, verifyMFALogin, verifyPhone, deleteAccount, forgotPassword, resetPassword, googleLogin, appleLogin } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: SecureP@ss123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+447700900077"
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, MERCHANT, DRIVER]
 *                 example: CUSTOMER
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed or password unsafe
 *       409:
 *         description: User already exists
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user and return JWT tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: SecureP@ss123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked due to failed attempts
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token using HTTP-only cookies or body token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New JWT and refresh token generated
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags:
 *       - Authentication
 *     responses:
 *       204:
 *         description: Logged out successfully
 */
router.post('/logout', logout);

/**
 * @openapi
 * /api/auth/verify-phone:
 *   post:
 *     summary: Verify user phone number via OTP code
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid or expired OTP code
 *       401:
 *         description: Unauthorized
 */
router.post('/verify-phone', authenticate, verifyPhone);

/**
 * @openapi
 * /api/auth/account:
 *   delete:
 *     summary: Delete user account
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/account', authenticate, deleteAccount);

// Recovery Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Social Auth Routes
router.post('/google-login', googleLogin);
router.post('/apple-login', appleLogin);

/**
 * @openapi
 * /api/auth/mfa/setup:
 *   get:
 *     summary: Generate MFA secret key and QR code URL
 *     tags:
 *       - Two-Factor Authentication (MFA)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup configuration returned
 *       401:
 *         description: Unauthorized
 */
router.get('/mfa/setup', authenticate, setupMFA);

/**
 * @openapi
 * /api/auth/mfa/enable:
 *   post:
 *     summary: Enable MFA by verifying the first OTP token
 *     tags:
 *       - Two-Factor Authentication (MFA)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA enabled successfully with backup codes
 *       400:
 *         description: Invalid token
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/enable', authenticate, verifyAndEnableMFA);

/**
 * @openapi
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Complete login using an MFA OTP token or backup code
 *     tags:
 *       - Two-Factor Authentication (MFA)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mfaToken
 *               - code
 *             properties:
 *               mfaToken:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA verification successful, returns access tokens
 *       400:
 *         description: Invalid OTP or backup code
 */
router.post('/mfa/verify', verifyMFALogin);

export default router;
