
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { 
    getMyStore, 
    getStoreOrders, 
    updateOrderStatus, 
    updateStore, 
    createProduct, 
    deleteProduct, 
    updateProduct, 
    uploadProductImage,
    getStoreRevenueAnalytics,
    triggerMerchantPayout
} from '../controllers/store-owner.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication and MERCHANT role
router.use(authenticate);
router.use(authorize(['MERCHANT', 'ADMIN']));

router.get('/my-store', getMyStore);
router.put('/my-store', updateStore);
router.get('/orders', getStoreOrders);
router.put('/orders/:orderId/status', updateOrderStatus);
router.get('/analytics/revenue', getStoreRevenueAnalytics);
router.post('/payouts', triggerMerchantPayout);

router.post('/products', createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);
router.post('/products/:productId/image', upload.single('product'), uploadProductImage);

export default router;
