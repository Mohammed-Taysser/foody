import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getCategoriesList,
  getCategoryById,
  listCategories,
  updateCategory,
} from './category.controller';
import { createCategorySchema, updateCategorySchema } from './category.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';

const router = Router();

router.get('/', ZodValidate(basePaginationSchema, 'query'), listCategories);

router.get('/list', getCategoriesList);

router.get('/:categoryId', getCategoryById);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(createCategorySchema),
  createCategory
);

router.patch(
  '/:categoryId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(updateCategorySchema),
  updateCategory
);

router.delete('/:categoryId', authenticate, authorize('OWNER', 'ADMIN'), deleteCategory);

export default router;
