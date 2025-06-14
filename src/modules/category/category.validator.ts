import { z } from 'zod';

const baseCategorySchema = z.object({
  name: z.string().min(2),
  restaurantId: z.string(),
});

const createCategorySchema = baseCategorySchema.extend({});

const updateCategorySchema = baseCategorySchema.partial();

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

interface GetByIdCategoryParams {
  categoryId: string;
}

export { createCategorySchema, updateCategorySchema };

export type { CreateCategoryInput, GetByIdCategoryParams, UpdateCategoryInput };
