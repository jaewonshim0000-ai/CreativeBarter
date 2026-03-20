import { Router } from 'express';
import * as communityController from '../controllers/community.controller';

const router = Router();

// These are PUBLIC endpoints — no authentication required
router.get('/map', communityController.getMapUsers);
router.get('/stats', communityController.getImpactStats);

export default router;
