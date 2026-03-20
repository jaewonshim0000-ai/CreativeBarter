import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as messageController from '../controllers/message.controller';

const router = Router();

router.get('/conversations', authenticate, messageController.getConversations);
router.get('/unread/count', authenticate, messageController.getUnreadCount);
router.post('/', authenticate, messageController.send);
router.get('/:userId', authenticate, messageController.getConversation);

export default router;
