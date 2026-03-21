import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as creditsController from '../controllers/credits.controller';

const router = Router();

// Wallet
router.get('/wallet', authenticate, creditsController.getWallet);

// Offers (negotiation)
router.post('/offers', authenticate, creditsController.proposeOffer);
router.post('/offers/:id/counter', authenticate, creditsController.counterOffer);
router.post('/offers/:id/accept', authenticate, creditsController.acceptOffer);
router.post('/offers/:id/reject', authenticate, creditsController.rejectOffer);
router.get('/offers/match/:matchId', authenticate, creditsController.getMatchOffers);
router.get('/offers/match/:matchId/active', authenticate, creditsController.getActiveOffer);

export default router;
