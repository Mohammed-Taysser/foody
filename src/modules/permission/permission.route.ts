import { Router } from 'express';

import permissionGroupsRoutes from './permission-groups.route';
import {
  createPermission,
  deletePermission,
  getPermissionById,
  getPermissionList,
  listPermissions,
  updatePermission,
} from './permission.controller';
import { createPermissionSchema, updatePermissionSchema } from './permission.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';

const router = Router();

router.use('/permission-groups', permissionGroupsRoutes);

router.get(
  '/',
  ZodValidate(basePaginationSchema, 'query'),
  requirePermission(['view:permission'], true),
  listPermissions
);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['add:permission']),
  ZodValidate(createPermissionSchema),
  createPermission
);

router.get('/list', requirePermission(['view:permission'], true), getPermissionList);

router.get('/:permissionId', requirePermission(['view:permission'], true), getPermissionById);

router.delete(
  '/:permissionId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['delete:permission']),
  deletePermission
);

router.patch(
  '/:permissionId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['update:permission']),
  ZodValidate(updatePermissionSchema),
  updatePermission
);

export default router;
