import { Router } from 'express';

import {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurants,
  getRestaurantsList,
  updateRestaurant,
} from './restaurant.controller';
import { createRestaurantSchema, updateRestaurantSchema } from './restaurant.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';

const router = Router();

router.get('/', ZodValidate(basePaginationSchema, 'query'), getRestaurants);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(createRestaurantSchema),
  createRestaurant
);

router.get('/list', getRestaurantsList);
router.get('/:restaurantId', getRestaurantById);

router.delete('/:restaurantId', authenticate, authorize('OWNER', 'ADMIN'), deleteRestaurant);

router.patch(
  '/:restaurantId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  ZodValidate(updateRestaurantSchema),
  updateRestaurant
);

export default router;
