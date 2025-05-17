import { z } from 'zod';

const createRestaurantSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  location: z.string().min(2),
  ownerId: z.string(),
});

export { createRestaurantSchema };
