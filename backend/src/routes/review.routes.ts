import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as reviewController from '../controllers/review.controller';

const router = Router();

router.post('/', authenticate, reviewController.create);
router.get('/user/:userId', authenticate, reviewController.getUserReviews);

export default router;
