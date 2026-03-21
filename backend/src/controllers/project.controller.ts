import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as projectService from '../services/project.service';

/** POST /api/projects */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const project = await projectService.createProject(req.userId!, req.body);
    res.status(201).json(project);
  } catch (error) { next(error); }
}

/** GET /api/projects/:id */
export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json(project);
  } catch (error) { next(error); }
}

/** PUT /api/projects/:id */
export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const project = await projectService.updateProject(req.params.id, req.userId!, req.body);
    res.json(project);
  } catch (error) { next(error); }
}

/** DELETE /api/projects/:id */
export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(req.params.id, req.userId!);
    res.json({ message: 'Project deleted.' });
  } catch (error) { next(error); }
}

/** GET /api/projects */
export async function search(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { keyword, status, tags, city, page, limit } = req.query;
    const result = await projectService.searchProjects({
      keyword: keyword as string,
      status: status as string,
      tags: tags ? (tags as string).split(',') : undefined,
      city: city as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    res.json(result);
  } catch (error) { next(error); }
}
