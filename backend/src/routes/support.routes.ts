import { Router } from 'express';
import { submitFeedback, getFeedbacks, getChatHistory } from '../controllers/support.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/feedback', authenticate, submitFeedback);
router.get('/feedback', authenticate, authorize(['ADMIN']), getFeedbacks);
router.get('/chat/history', authenticate, getChatHistory);

export default router;
