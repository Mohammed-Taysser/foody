import { Router } from 'express';

import { updateMe } from './user.controller';
import { updateProfileSchema } from './user.validator';

import zodValidate from '@/middleware/ZodValidate.middleware';
import authenticate from '@/middleware/auth.middleware';

const router = Router();

router.patch('/me', authenticate, zodValidate(updateProfileSchema), updateMe);

export default router;
