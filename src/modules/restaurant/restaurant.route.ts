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
import requirePermission from '@/middleware/require-permission.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';
import { upload } from '@/utils/multer.utils';

const router = Router();

router.get(
  '/',
  ZodValidate(basePaginationSchema, 'query'),
  requirePermission(['view:restaurant'], true),
  getRestaurants
);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['add:restaurant']),
  upload.single('image'),
  ZodValidate(createRestaurantSchema),
  createRestaurant
);

router.get('/list', requirePermission(['view:restaurant'], true), getRestaurantsList);
router.get('/:restaurantId', requirePermission(['view:restaurant'], true), getRestaurantById);

router.delete(
  '/:restaurantId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['delete:restaurant']),
  deleteRestaurant
);

router.patch(
  '/:restaurantId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['update:restaurant']),
  upload.single('image'),
  ZodValidate(updateRestaurantSchema),
  updateRestaurant
);

export default router;
