import { Router } from 'express';

import { getProfile, updateMe } from './user.controller';
import { updateProfileSchema } from './user.validator';

import zodValidate from '@/middleware/ZodValidate.middleware';
import authenticateMiddleware from '@/middleware/authenticate.middleware';

const router = Router();

router.patch('/me', authenticateMiddleware, zodValidate(updateProfileSchema), updateMe);
router.get('/me', authenticateMiddleware, getProfile);

export default router;
