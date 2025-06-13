import { Router } from 'express';

import {
  addMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  getMenuItemsList,
  updateMenuItem,
} from './menu-items.controller';
import {
  createMenuItemSchema,
  menuItemQuerySchema,
  updateMenuItemSchema,
} from './menu-items.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import { upload } from '@/utils/multer.utils';

const router = Router();

router.get(
  '/',
  ZodValidate(menuItemQuerySchema, 'query'),
  requirePermission(['view:menuItem'], true),
  getMenuItems
);

router.get('/list', requirePermission(['view:menuItem'], true), getMenuItemsList);

router.get('/:itemId', requirePermission(['view:menuItem'], true), getMenuItemById);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['add:menuItem']),
  upload.single('image'),
  ZodValidate(createMenuItemSchema),
  addMenuItem
);

router.patch(
  '/:itemId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['update:menuItem']),
  upload.single('image'),
  ZodValidate(updateMenuItemSchema),
  updateMenuItem
);

router.delete(
  '/:itemId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['delete:menuItem']),
  deleteMenuItem
);

export default router;
