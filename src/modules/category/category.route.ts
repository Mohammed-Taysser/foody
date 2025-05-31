import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './category.controller';
import { createCategorySchema } from './category.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import validate from '@/middleware/zod-validate.middleware';

const router = Router({ mergeParams: true });

router.get('/', listCategories);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createCategorySchema),
  createCategory
);

router.patch(
  '/:categoryId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createCategorySchema),
  updateCategory
);

router.delete('/:categoryId', authenticate, authorize('OWNER', 'ADMIN'), deleteCategory);

export default router;
