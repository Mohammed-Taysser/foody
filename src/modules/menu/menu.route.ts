import { Router } from 'express';

import { addMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from './menu.controller';
import { createMenuItemSchema, updateMenuItemSchema } from './menu.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import validate from '@/middleware/ZodValidate.middleware';

const router = Router({ mergeParams: true });

router.get('/', getMenuItems);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createMenuItemSchema),
  addMenuItem
);

router.patch(
  '/:itemId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(updateMenuItemSchema),
  updateMenuItem
);

router.delete('/:itemId', authenticate, authorize('OWNER', 'ADMIN'), deleteMenuItem);

export default router;
