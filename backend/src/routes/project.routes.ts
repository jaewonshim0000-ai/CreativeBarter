import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as projectController from '../controllers/project.controller';

const router = Router();

router.get('/', authenticate, projectController.search);
router.post('/', authenticate, projectController.create);
router.get('/:id', authenticate, projectController.getById);
router.put('/:id', authenticate, projectController.update);
router.delete('/:id', authenticate, projectController.remove);

export default router;
