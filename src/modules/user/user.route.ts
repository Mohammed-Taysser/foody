import { Router } from 'express';

import {
  createUser,
  deleteUser,
  getProfile,
  getUserById,
  getUserPermission,
  getUsers,
  getUsersList,
  updateMe,
  updateUser,
} from './user.controller';
import { createUserSchema, updateUserSchema } from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import authorizeMiddleware from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import zodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';
import { upload } from '@/utils/multer.utils';

const router = Router();

router.patch('/me', authenticateMiddleware, zodValidate(updateUserSchema), updateMe);
router.get('/me', authenticateMiddleware, getProfile);
router.get('/me/permissions', authenticateMiddleware, getUserPermission);

router.get('/list', requirePermission(['view:user'], true), getUsersList);
router.get(
  '/',
  requirePermission(['view:user'], true),
  zodValidate(basePaginationSchema, 'query'),
  getUsers
);
router.get('/:userId', requirePermission(['view:user'], true), getUserById);

router.post(
  '/',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  requirePermission(['add:user']),
  upload.single('image'),
  zodValidate(createUserSchema),
  createUser
);

router.patch(
  '/:userId',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  requirePermission(['update:user']),
  zodValidate(updateUserSchema),
  updateUser
);
router.delete('/:userId', authenticateMiddleware, authorizeMiddleware('ADMIN'), deleteUser);

export default router;
