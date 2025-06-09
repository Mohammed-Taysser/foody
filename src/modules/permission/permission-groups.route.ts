import { Router } from 'express';

import {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroupById,
  getPermissionGroupList,
  listPermissionGroups,
  updatePermissionGroup,
} from './permission-group.controller';
import { createPermissionGroupSchema, updatePermissionGroupSchema } from './permission.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';

const router = Router();

router.get(
  '/',
  ZodValidate(basePaginationSchema, 'query'),
  requirePermission(['view:permissionGroup'], true),
  listPermissionGroups
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['add:permissionGroup']),
  ZodValidate(createPermissionGroupSchema),
  createPermissionGroup
);

router.get('/list', requirePermission(['view:permissionGroup'], true), getPermissionGroupList);
router.get(
  '/:permissionGroupId',
  requirePermission(['view:permissionGroup'], true),
  getPermissionGroupById
);

router.delete(
  '/:permissionGroupId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['delete:permissionGroup']),
  deletePermissionGroup
);

router.patch(
  '/:permissionGroupId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['update:permissionGroup']),
  ZodValidate(updatePermissionGroupSchema),
  updatePermissionGroup
);

export default router;
