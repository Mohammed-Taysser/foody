import { Router } from 'express';

import controller from './permission-group.controller';
import validator from './permission.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const router = Router();

router.get(
  '/',
  validateRequest(validator.getPermissionGroupListSchema),
  requirePermission(['view:permissionGroup'], true),
  controller.getPermissionGroups
);

router.get(
  '/export',
  authenticate,
  validateRequest(validator.exportPermissionGroupsSchema),
  requirePermission(['export:permissionGroup']),
  controller.exportPermissionGroups
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['add:permissionGroup']),
  validateRequest(validator.createPermissionGroupSchema),
  controller.createPermissionGroup
);

router.get(
  '/list',
  requirePermission(['view:permissionGroup'], true),
  controller.getPermissionGroupList
);
router.get(
  '/:permissionGroupId',
  requirePermission(['view:permissionGroup'], true),
  controller.getPermissionGroupById
);

router.delete(
  '/:permissionGroupId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['delete:permissionGroup']),
  controller.deletePermissionGroup
);

router.patch(
  '/:permissionGroupId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['update:permissionGroup']),
  validateRequest(validator.updatePermissionGroupSchema),
  controller.updatePermissionGroup
);

export default router;
