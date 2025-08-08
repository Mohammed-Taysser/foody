import { Router } from 'express';

import controller from './user.controller';
import validator from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import authorizeMiddleware from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';
import { imageUploadMiddleware } from '@/utils/multer.utils';
import multerErrorHandler from '@/middleware/multer-error-handler.middleware';

const router = Router();

router.patch(
  '/me',
  validateRequest(validator.updateMeSchema),
  authenticateMiddleware,
  multerErrorHandler(imageUploadMiddleware.single('image')),
  controller.updateMe
);
router.get('/me', authenticateMiddleware, controller.getProfile);
router.get('/me/permissions', authenticateMiddleware, controller.getUserPermission);

router.get(
  '/list',
  requirePermission(['view:user'], true),
  validateRequest(validator.getUsersListSchema),
  controller.getUsersList
);
router.get(
  '/',
  requirePermission(['view:user'], true),
  validateRequest(validator.getUsersListSchema),
  controller.getUsers
);
router.get(
  '/export',
  authenticateMiddleware,
  requirePermission(['export:user']),
  validateRequest(validator.exportUsersQuery),
  controller.exportUsers
);
router.get(
  '/:userId',
  requirePermission(['view:user'], true),
  validateRequest(validator.getUserByIdSchema),
  controller.getUserById
);

router.post(
  '/',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  requirePermission(['add:user']),
  multerErrorHandler(imageUploadMiddleware.single('image')),
  validateRequest(validator.createUserSchema),
  controller.createUser
);

router.patch(
  '/:userId',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  requirePermission(['update:user']),
  multerErrorHandler(imageUploadMiddleware.single('image')),
  validateRequest(validator.updateUserSchema),
  controller.updateUser
);
router.delete(
  '/:userId',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  controller.deleteUser
);

export default router;
