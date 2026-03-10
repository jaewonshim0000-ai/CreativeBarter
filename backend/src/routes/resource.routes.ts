import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

/** GET /api/resources - List all resources */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, search } = req.query;
    const where: any = {};
    if (type) where.resourceType = type;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const resources = await prisma.resource.findMany({ where, orderBy: { name: 'asc' } });
    res.json(resources);
  } catch (error) { next(error); }
});

/** POST /api/resources - Create a new resource */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, resourceType } = req.body;
    const resource = await prisma.resource.create({ data: { name, description, resourceType } });
    res.status(201).json(resource);
  } catch (error) { next(error); }
});

export default router;
