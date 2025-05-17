import { Router } from 'express';

import { createRestaurant, getRestaurants } from './restaurant.controller';
import { createRestaurantSchema } from './restaurant.validator';

import ZodValidate from '@/middleware/ZodValidate.middleware';
import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
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

export default router;
