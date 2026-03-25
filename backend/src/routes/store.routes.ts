
import { Router } from 'express';
import { createStore, getStores, getStoreBySlug, updateStoreLogo, updateStoreCover } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/', authenticate, createStore);
router.get('/', getStores);
router.get('/:slug', getStoreBySlug);
router.post('/:storeId/logo', authenticate, upload.single('logo'), updateStoreLogo);
router.post('/:storeId/cover', authenticate, upload.single('cover'), updateStoreCover);

export default router;
