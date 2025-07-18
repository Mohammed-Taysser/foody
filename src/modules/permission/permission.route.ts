import { Router } from 'express';

import permissionGroupsRoutes from './permission-groups.route';
import controller from './permission.controller';
import validator from './permission.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const router = Router();

router.use('/permission-groups', permissionGroupsRoutes);

router.get(
  '/',
  validateRequest(validator.getPermissionListSchema),
  requirePermission(['view:permission'], true),
  controller.getPermissions
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['add:permission']),
  validateRequest(validator.createPermissionSchema),
  controller.createPermission
);

router.get('/list', requirePermission(['view:permission'], true), controller.getPermissionList);

router.get(
  '/:permissionId',
  requirePermission(['view:permission'], true),
  validateRequest(validator.getPermissionByIdSchema),
  controller.getPermissionById
);

router.delete(
  '/:permissionId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['delete:permission']),
  controller.deletePermission
);

router.patch(
  '/:permissionId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['update:permission']),
  validateRequest(validator.updatePermissionSchema),
  controller.updatePermission
);

export default router;
