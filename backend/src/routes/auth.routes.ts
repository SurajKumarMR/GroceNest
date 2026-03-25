
import { Router } from 'express';
import { register, login, refresh, logout, setupMFA, verifyAndEnableMFA, verifyMFALogin, verifyPhone, deleteAccount, forgotPassword, resetPassword, googleLogin, appleLogin } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-phone', authenticate, verifyPhone);
router.delete('/account', authenticate, deleteAccount);

// Recovery Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Social Auth Routes
router.post('/google-login', googleLogin);
router.post('/apple-login', appleLogin);

// MFA Routes
router.get('/mfa/setup', authenticate, setupMFA);
router.post('/mfa/enable', authenticate, verifyAndEnableMFA);
router.post('/mfa/verify', verifyMFALogin);

export default router;
