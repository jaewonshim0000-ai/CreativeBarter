import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as matchController from '../controllers/match.controller';

const router = Router();

router.get('/', authenticate, matchController.getMyMatches);
router.post('/', authenticate, matchController.create);
router.post('/analyze', authenticate, matchController.analyzeText);
router.patch('/:id/status', authenticate, matchController.updateStatus);
router.get('/recommendations/:projectId', authenticate, matchController.getRecommendations);

export default router;
