import { Router } from 'express';

import { createRestaurant, getRestaurants } from './restaurant.controller';
import { createRestaurantSchema } from './restaurant.validator';

import ZodValidate from '@/middleware/ZodValidate.middleware';
import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';

const router = Router();

router.get('/', getRestaurants);
router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(createRestaurantSchema),
  createRestaurant
);

export default router;
