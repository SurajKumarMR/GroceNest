
import { Router } from 'express';
import { getProfile, updateProfile, createAddress, getAddresses, deleteAddress, updateAvatar } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/avatar', authenticate, upload.single('avatar'), updateAvatar);
router.post('/addresses', authenticate, createAddress);
router.get('/addresses', authenticate, getAddresses);
router.delete('/addresses/:addressId', authenticate, deleteAddress);

export default router;
