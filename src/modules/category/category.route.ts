import { Router } from 'express';

import { createCategory, listCategories } from './category.controller';
import { createCategorySchema } from './category.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import validate from '@/middleware/ZodValidate.middleware';

const router = Router({ mergeParams: true });

router.get('/', listCategories);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createCategorySchema),
  createCategory
);

export default router;
