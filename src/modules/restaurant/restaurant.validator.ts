import { z } from 'zod';

const createRestaurantSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  location: z.string().min(2),
});

export { createRestaurantSchema };
