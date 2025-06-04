import { Router } from 'express';

import {
  createUser,
  deleteUser,
  getProfile,
  getUsers,
  getUser,
  updateMe,
  updateUser,
} from './user.controller';
import { createUserSchema, updateProfileSchema } from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import authorizeMiddleware from '@/middleware/authorize.middleware';
import zodValidate from '@/middleware/zod-validate.middleware';

const router = Router();

router.patch('/me', authenticateMiddleware, zodValidate(updateProfileSchema), updateMe);
router.get('/me', authenticateMiddleware, getProfile);
router.get('/', getUsers);
router.get('/:userId', getUser);
router.post(
  '/',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  zodValidate(createUserSchema),
  createUser
);

router.patch(
  '/:userId',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  zodValidate(updateProfileSchema),
  updateUser
);
router.delete('/:userId', authenticateMiddleware, authorizeMiddleware('ADMIN'), deleteUser);

export default router;
