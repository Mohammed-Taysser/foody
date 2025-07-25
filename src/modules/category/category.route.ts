import { Router } from 'express';

import controller from './category.controller';
import validator from './category.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';
import { imageUploadMiddleware } from '@/utils/multer.utils';

const router = Router();

router.get(
  '/',
  requirePermission(['view:category'], true),
  validateRequest(validator.getCategoriesSchema),
  controller.getCategories
);

router.get(
  '/list',
  requirePermission(['view:category'], true),
  validateRequest(validator.getCategoriesSchema),
  controller.getCategoriesList
);

router.get(
  '/:categoryId',
  requirePermission(['view:category'], true),
  validateRequest(validator.getCategoryByIdSchema),
  controller.getCategoryById
);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['add:category']),
  imageUploadMiddleware.single('image'),
  validateRequest(validator.createCategorySchema),
  controller.createCategory
);

router.patch(
  '/:categoryId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['update:category']),
  imageUploadMiddleware.single('image'),
  validateRequest(validator.updateCategorySchema),
  controller.updateCategory
);

router.delete(
  '/:categoryId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['delete:category']),
  validateRequest(validator.getCategoryByIdSchema),
  controller.deleteCategory
);

export default router;
