import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getCategoriesList,
  getCategoryById,
  getCategories,
  updateCategory,
} from './category.controller';
import { createCategorySchema, updateCategorySchema } from './category.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';
import { upload } from '@/utils/multer.utils';

const router = Router();

router.get(
  '/',
  requirePermission(['view:category'], true),
  ZodValidate(basePaginationSchema, 'query'),
  getCategories
);

router.get('/list', requirePermission(['view:category'], true), getCategoriesList);

router.get('/:categoryId', requirePermission(['view:category'], true), getCategoryById);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['add:category']),
  upload.single('image'),
  ZodValidate(createCategorySchema),
  createCategory
);

router.patch(
  '/:categoryId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['update:category']),
  upload.single('image'),
  ZodValidate(updateCategorySchema),
  updateCategory
);

router.delete(
  '/:categoryId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['delete:category']),
  deleteCategory
);

export default router;
