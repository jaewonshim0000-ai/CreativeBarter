import { Request, Response, NextFunction } from 'express';
import * as communityService from '../services/community.service';

/** GET /api/community/map - Public: get users on the map */
export async function getMapUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await communityService.getMapUsers();
    res.json(users);
  } catch (error) { next(error); }
}

/** GET /api/community/stats - Public: get impact statistics */
export async function getImpactStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await communityService.getImpactStats();
    res.json(stats);
  } catch (error) { next(error); }
}
