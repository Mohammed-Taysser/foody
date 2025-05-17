import { Router } from 'express';

import { addMenuItem, getMenuItems } from './menu.controller';
import { createMenuItemSchema } from './menu.validator';

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

export default router;
