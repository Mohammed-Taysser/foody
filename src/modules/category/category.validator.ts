import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2),
});

export { createCategorySchema };
