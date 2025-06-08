import { Router } from 'express';

import {
  createUser,
  deleteUser,
  getProfile,
  getUser,
  getUsers,
  getUsersList,
  updateMe,
  updateUser,
} from './user.controller';
import { createUserSchema, updateUserSchema } from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import authorizeMiddleware from '@/middleware/authorize.middleware';
import zodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';

const router = Router();

router.patch('/me', authenticateMiddleware, zodValidate(updateUserSchema), updateMe);
router.get('/me', authenticateMiddleware, getProfile);
router.get('/list', getUsersList);
router.get('/', zodValidate(basePaginationSchema, 'query'), getUsers);
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
  zodValidate(updateUserSchema),
  updateUser
);
router.delete('/:userId', authenticateMiddleware, authorizeMiddleware('ADMIN'), deleteUser);

export default router;
