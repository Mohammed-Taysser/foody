import { Router } from 'express';

import { createRestaurant, getRestaurants } from './restaurant.controller';
import { createRestaurantSchema } from './restaurant.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import categoryRoutes from '@/modules/category/category.route';
import menuRoutes from '@/modules/menu/menu.route';

const router = Router();

router.get('/', getRestaurants);
router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(createRestaurantSchema),
  createRestaurant
);

router.use('/:id/menu', menuRoutes);
router.use('/:id/categories', categoryRoutes);

export default router;
