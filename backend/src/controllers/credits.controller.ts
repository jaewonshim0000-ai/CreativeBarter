import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as creditsService from '../services/credits.service';

/** GET /api/credits/wallet */
export async function getWallet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const wallet = await creditsService.getWallet(req.userId!);
    res.json(wallet);
  } catch (error) { next(error); }
}

/** POST /api/credits/offers */
export async function proposeOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { matchId, amount, payerId, payeeId, note } = req.body;
    if (!matchId || amount === undefined || !payerId || !payeeId) {
      res.status(400).json({ error: 'matchId, amount, payerId, and payeeId are required.' });
      return;
    }
    const offer = await creditsService.proposeOffer(
      matchId, req.userId!, amount, payerId, payeeId, note
    );
    res.status(201).json(offer);
  } catch (error) { next(error); }
}

/** POST /api/credits/offers/:id/counter */
export async function counterOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { counterAmount, counterNote, payerId, payeeId } = req.body;
    if (counterAmount === undefined) {
      res.status(400).json({ error: 'counterAmount is required.' });
      return;
    }
    const offer = await creditsService.counterOffer(
      req.params.id, req.userId!, counterAmount, counterNote, payerId, payeeId
    );
    res.json(offer);
  } catch (error) { next(error); }
}

/** POST /api/credits/offers/:id/accept */
export async function acceptOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const offer = await creditsService.acceptOffer(req.params.id, req.userId!);
    res.json(offer);
  } catch (error) { next(error); }
}

/** POST /api/credits/offers/:id/reject */
export async function rejectOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const offer = await creditsService.rejectOffer(req.params.id, req.userId!);
    res.json(offer);
  } catch (error) { next(error); }
}

/** GET /api/credits/offers/match/:matchId */
export async function getMatchOffers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const offers = await creditsService.getMatchOffers(req.params.matchId);
    res.json(offers);
  } catch (error) { next(error); }
}

/** GET /api/credits/offers/match/:matchId/active */
export async function getActiveOffer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const offer = await creditsService.getActiveOffer(req.params.matchId);
    res.json(offer);
  } catch (error) { next(error); }
}
