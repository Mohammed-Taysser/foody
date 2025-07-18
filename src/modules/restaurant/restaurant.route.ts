import { Router } from 'express';

import controller from './restaurant.controller';
import validator from './restaurant.validator';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';
import { imageUploadMiddleware } from '@/utils/multer.utils';

const router = Router();

router.get(
  '/',
  validateRequest(validator.getRestaurantListSchema),
  requirePermission(['view:restaurant'], true),
  controller.getRestaurants
);

router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['add:restaurant']),
  imageUploadMiddleware.single('image'),
  validateRequest(validator.createRestaurantSchema),
  controller.createRestaurant
);

router.get('/list', requirePermission(['view:restaurant'], true), controller.getRestaurantsList);
router.get(
  '/:restaurantId',
  requirePermission(['view:restaurant'], true),
  validateRequest(validator.getRestaurantByIdSchema),
  controller.getRestaurantById
);

router.delete(
  '/:restaurantId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['delete:restaurant']),
  validateRequest(validator.getRestaurantByIdSchema),
  controller.deleteRestaurant
);

router.patch(
  '/:restaurantId',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  requirePermission(['update:restaurant']),
  imageUploadMiddleware.single('image'),
  validateRequest(validator.updateRestaurantSchema),
  controller.updateRestaurant
);

export default router;
