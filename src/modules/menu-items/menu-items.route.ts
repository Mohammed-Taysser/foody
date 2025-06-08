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
import ZodValidate from '@/middleware/zod-validate.middleware';

const router = Router();

router.get('/', ZodValidate(menuItemQuerySchema, 'query'), getMenuItems);

router.get('/list', getMenuItemsList);

router.get('/:itemId', getMenuItemById);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(createMenuItemSchema),
  addMenuItem
);

router.patch(
  '/:itemId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(updateMenuItemSchema),
  updateMenuItem
);

router.delete('/:itemId', authenticate, authorize('OWNER', 'ADMIN'), deleteMenuItem);

export default router;
