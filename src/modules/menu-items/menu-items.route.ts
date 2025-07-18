import { Router } from 'express';

import controller from './menu-items.controller';
import validator from './menu-items.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';
import { imageUploadMiddleware } from '@/utils/multer.utils';

const router = Router();

router.get(
  '/',
  requirePermission(['view:menuItem'], true),
  validateRequest(validator.getMenuItemsSchema),
  controller.getMenuItems
);

router.get(
  '/list',
  requirePermission(['view:menuItem'], true),
  validateRequest(validator.getMenuItemsSchema),
  controller.getMenuItemsList
);

router.get(
  '/:menuId',
  requirePermission(['view:menuItem'], true),
  validateRequest(validator.geyMenuItemByIdSchema),
  controller.getMenuItemById
);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['add:menuItem']),
  imageUploadMiddleware.single('image'),
  validateRequest(validator.createMenuItemSchema),
  controller.createMenuItem
);

router.patch(
  '/:menuId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['update:menuItem']),
  imageUploadMiddleware.single('image'),
  validateRequest(validator.updateMenuItemSchema),
  controller.updateMenuItem
);

router.delete(
  '/:menuId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['delete:menuItem']),
  validateRequest(validator.geyMenuItemByIdSchema),
  controller.deleteMenuItem
);

export default router;
