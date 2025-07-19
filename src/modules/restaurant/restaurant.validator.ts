import { z } from 'zod';

import { basePaginationSchema } from '@/validations/base.validation';

const getRestaurantListSchema = {
  query: basePaginationSchema.extend({
    name: z.string().trim().max(100).optional(),
  }),
};

const createRestaurantSchema = {
  body: z.object({
    name: z.string().trim().min(2),
    description: z.string().trim().default(''),
    location: z.string().trim().min(2),
    ownerId: z.string().trim().min(1).max(100),
  }),
};

const updateRestaurantSchema = {
  body: z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().default('').optional(),
    location: z.string().trim().min(2).optional(),
    ownerId: z.string().trim().optional(),
  }),
  params: z.object({
    restaurantId: z.string().trim().max(100),
  }),
};

const getRestaurantByIdSchema = {
  params: z.object({
    restaurantId: z.string().trim().max(100),
  }),
};

type GetRestaurantListQuery = z.infer<typeof getRestaurantListSchema.query>;
type CreateRestaurantInput = z.infer<typeof createRestaurantSchema.body>;
type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema.body>;
type GetRestaurantByIdParams = z.infer<typeof getRestaurantByIdSchema.params>;

const restaurantValidator = {
  createRestaurantSchema,
  updateRestaurantSchema,
  getRestaurantListSchema,
  getRestaurantByIdSchema,
};

export type {
  GetRestaurantListQuery,
  CreateRestaurantInput,
  UpdateRestaurantInput,
  GetRestaurantByIdParams,
};
export default restaurantValidator;
