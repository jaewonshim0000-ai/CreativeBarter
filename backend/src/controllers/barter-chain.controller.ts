import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as barterChainService from '../services/barter-chain.service';

// ---- User Wants ----

/** POST /api/barter-chains/wants */
export async function addWant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { skillName, description, priority } = req.body;
    if (!skillName) { res.status(400).json({ error: 'skillName is required.' }); return; }
    const want = await barterChainService.addUserWant(req.userId!, skillName, description, priority);
    res.status(201).json(want);
  } catch (error) { next(error); }
}

/** DELETE /api/barter-chains/wants/:skillName */
export async function removeWant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await barterChainService.removeUserWant(req.userId!, req.params.skillName);
    res.json({ message: 'Want removed.' });
  } catch (error) { next(error); }
}

/** GET /api/barter-chains/wants */
export async function getMyWants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const wants = await barterChainService.getUserWants(req.userId!);
    res.json(wants);
  } catch (error) { next(error); }
}

// ---- Discovery ----

/** GET /api/barter-chains/discover */
export async function discoverChains(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const maxLength = req.query.maxLength ? parseInt(req.query.maxLength as string) : 5;
    const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string) : 10;
    const result = await barterChainService.findCircularBarters(maxLength, maxResults);
    res.json(result);
  } catch (error) { next(error); }
}

// ---- Chain CRUD ----

/** POST /api/barter-chains */
export async function createChain(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, participants, confidenceScore } = req.body;
    const chain = await barterChainService.createBarterChain(
      req.userId!, title, description, participants, confidenceScore
    );
    res.status(201).json(chain);
  } catch (error) { next(error); }
}

/** GET /api/barter-chains/:id */
export async function getChain(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const chain = await barterChainService.getBarterChain(req.params.id);
    res.json(chain);
  } catch (error) { next(error); }
}

/** GET /api/barter-chains */
export async function getMyChains(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const chains = await barterChainService.getUserChains(req.userId!, req.query.status as string);
    res.json(chains);
  } catch (error) { next(error); }
}

/** POST /api/barter-chains/:id/respond */
export async function respondToChain(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { accept } = req.body;
    if (accept === undefined) { res.status(400).json({ error: 'accept (boolean) is required.' }); return; }
    const result = await barterChainService.respondToChain(req.params.id, req.userId!, accept);
    res.json(result);
  } catch (error) { next(error); }
}

/** POST /api/barter-chains/:id/complete */
export async function completeChain(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const chain = await barterChainService.completeChain(req.params.id, req.userId!);
    res.json(chain);
  } catch (error) { next(error); }
}
