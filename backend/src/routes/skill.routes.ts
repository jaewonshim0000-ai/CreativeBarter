import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

/** GET /api/skills - List all skills (with optional category filter) */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    const where: any = {};
    if (category) where.category = category;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const skills = await prisma.skill.findMany({ where, orderBy: { name: 'asc' } });
    res.json(skills);
  } catch (error) { next(error); }
});

/** POST /api/skills - Create a new skill */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, category } = req.body;
    const skill = await prisma.skill.create({ data: { name, description, category } });
    res.status(201).json(skill);
  } catch (error) { next(error); }
});

export default router;
