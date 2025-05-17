import { Router } from 'express';

import { createRestaurant, getRestaurants } from './restaurant.controller';
import { createRestaurantSchema } from './restaurant.validator';

import ZodValidate from '@/middleware/ZodValidate.middleware';
import authenticate from '@/middleware/authenticate.middleware';

const router = Router();

router.get('/', getRestaurants);
router.post('/', authenticate, ZodValidate(createRestaurantSchema), createRestaurant);

export default router;
