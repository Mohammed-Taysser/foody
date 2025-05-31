import { Router } from 'express';

import { getProfile, updateMe } from './user.controller';
import { updateProfileSchema } from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import zodValidate from '@/middleware/zod-validate.middleware';

const router = Router();

router.patch('/me', authenticateMiddleware, zodValidate(updateProfileSchema), updateMe);
router.get('/me', authenticateMiddleware, getProfile);

export default router;
