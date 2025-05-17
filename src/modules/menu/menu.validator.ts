import { z } from 'zod';

const createMenuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0.01),
  available: z.boolean().optional(),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

export { createMenuItemSchema, updateMenuItemSchema };
