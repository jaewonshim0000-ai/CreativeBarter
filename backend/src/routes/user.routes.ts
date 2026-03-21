import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/search', authenticate, userController.searchUsers);
router.get('/me', authenticate, userController.getMyProfile);
router.put('/me', authenticate, userController.updateMyProfile);
router.post('/me/skills', authenticate, userController.addSkill);
router.post('/me/skills/bulk', authenticate, userController.bulkSaveSkills);
router.delete('/me/skills/:skillId', authenticate, userController.removeSkill);
router.post('/me/resources', authenticate, userController.addResource);
router.delete('/me/resources/:resourceId', authenticate, userController.removeResource);
router.get('/:id', authenticate, userController.getUserById);

export default router;
