import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/user.service';

/** GET /api/users/me */
export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getUserProfile(req.userId!);
    res.json(profile);
  } catch (error) { next(error); }
}

/** GET /api/users/:id */
export async function getUserById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getUserProfile(req.params.id);
    res.json(profile);
  } catch (error) { next(error); }
}

/** PUT /api/users/me */
export async function updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const updated = await userService.updateUserProfile(req.userId!, req.body);
    res.json(updated);
  } catch (error) { next(error); }
}

/** POST /api/users/me/skills */
export async function addSkill(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { skillId, proficiency, yearsExperience } = req.body;
    const result = await userService.addUserSkill(req.userId!, skillId, proficiency, yearsExperience);
    res.status(201).json(result);
  } catch (error) { next(error); }
}

/** DELETE /api/users/me/skills/:skillId */
export async function removeSkill(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await userService.removeUserSkill(req.userId!, req.params.skillId);
    res.json({ message: 'Skill removed.' });
  } catch (error) { next(error); }
}

/** POST /api/users/me/resources */
export async function addResource(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { resourceId, details, availability } = req.body;
    const result = await userService.addUserResource(req.userId!, resourceId, details, availability);
    res.status(201).json(result);
  } catch (error) { next(error); }
}

/** DELETE /api/users/me/resources/:resourceId */
export async function removeResource(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await userService.removeUserResource(req.userId!, req.params.resourceId);
    res.json({ message: 'Resource removed.' });
  } catch (error) { next(error); }
}

/** GET /api/users/search */
export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { keyword, specialty, skillIds, latitude, longitude, radiusKm, page, limit } = req.query;
    const result = await userService.searchUsers({
      keyword: keyword as string,
      specialty: specialty as string,
      skillIds: skillIds ? (skillIds as string).split(',') : undefined,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    res.json(result);
  } catch (error) { next(error); }
}
