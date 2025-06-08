import { z } from 'zod';

const baseRestaurantSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(''),
  location: z.string().min(2),
  ownerId: z.string(),
});

const createRestaurantSchema = baseRestaurantSchema.extend({});

const updateRestaurantSchema = baseRestaurantSchema.partial();

export { createRestaurantSchema, updateRestaurantSchema };
