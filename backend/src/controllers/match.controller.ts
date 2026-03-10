import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as matchService from '../services/match.service';

/** POST /api/matches */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { projectId, receiverId, message } = req.body;
    const match = await matchService.createMatch(projectId, req.userId!, receiverId, message);
    res.status(201).json(match);
  } catch (error) { next(error); }
}

/** PATCH /api/matches/:id/status */
export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const match = await matchService.updateMatchStatus(req.params.id, req.userId!, status);
    res.json(match);
  } catch (error) { next(error); }
}

/** GET /api/matches */
export async function getMyMatches(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const matches = await matchService.getUserMatches(req.userId!, req.query.status as string);
    res.json(matches);
  } catch (error) { next(error); }
}

/** GET /api/matches/recommendations/:projectId */
export async function getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await matchService.getProjectRecommendations(req.params.projectId);
    res.json(result);
  } catch (error) { next(error); }
}
