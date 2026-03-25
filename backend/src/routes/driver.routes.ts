
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAvailableOrders, acceptOrder, deliverOrder, getMyDeliveries, uploadLicense, uploadInsurance } from '../controllers/driver.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['DRIVER', 'ADMIN']));

router.get('/available', getAvailableOrders);
router.post('/orders/:orderId/accept', acceptOrder);
router.post('/orders/:orderId/deliver', deliverOrder);
router.get('/my-deliveries', getMyDeliveries);
router.post('/upload-license', uploadLicense);
router.post('/upload-insurance', uploadInsurance);

export default router;
