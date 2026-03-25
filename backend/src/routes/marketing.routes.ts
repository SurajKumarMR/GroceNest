import { Router } from 'express';
import { joinWaitlist, getWaitlist } from '../controllers/marketing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/waitlist', joinWaitlist);
router.get('/waitlist', authenticate, authorize(['ADMIN']), getWaitlist);

export default router;
