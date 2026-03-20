import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as barterChainController from '../controllers/barter-chain.controller';

const router = Router();

// User Wants (what skills I'm looking for)
router.get('/wants', authenticate, barterChainController.getMyWants);
router.post('/wants', authenticate, barterChainController.addWant);
router.delete('/wants/:skillName', authenticate, barterChainController.removeWant);

// Discovery (AI-powered circular barter detection)
router.get('/discover', authenticate, barterChainController.discoverChains);

// Chain CRUD
router.get('/', authenticate, barterChainController.getMyChains);
router.post('/', authenticate, barterChainController.createChain);
router.get('/:id', authenticate, barterChainController.getChain);
router.post('/:id/respond', authenticate, barterChainController.respondToChain);
router.post('/:id/complete', authenticate, barterChainController.completeChain);

export default router;
