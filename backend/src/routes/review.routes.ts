import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as reviewController from '../controllers/review.controller';

const router = Router();

router.post('/', authenticate, reviewController.create);
router.get('/by-me', authenticate, reviewController.getMyReviews);
router.get('/reviewable', authenticate, reviewController.getReviewableMatches);
router.get('/user/:userId', authenticate, reviewController.getUserReviews);

export default router;
