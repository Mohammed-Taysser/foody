import { z } from 'zod';

import basePaginationSchema from '@/validations/pagination.validation';

const baseMenuItemSchema = z.object({
  name: z.string().min(5),
  description: z.string().default(''),
  price: z.number().min(0.01),
  available: z.boolean().optional(),
  categoryId: z.string(),
  restaurantId: z.string(),
});

const createMenuItemSchema = baseMenuItemSchema.extend({});

const updateMenuItemSchema = baseMenuItemSchema.partial();

const menuItemQuerySchema = basePaginationSchema.extend({
  available: z.coerce.boolean().optional(),
  restaurantId: z.string().optional(),
});

export { createMenuItemSchema, menuItemQuerySchema, updateMenuItemSchema };
