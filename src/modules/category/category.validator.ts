import { z } from 'zod';

const baseCategorySchema = z.object({
  name: z.string().min(2),
  restaurantId: z.string(),
});

const createCategorySchema = baseCategorySchema.extend({});

const updateCategorySchema = baseCategorySchema.partial();

export { createCategorySchema, updateCategorySchema };
