import { z } from 'zod';

import basePaginationSchema from '@/validations/pagination.validation';

const baseMenuItemSchema = z.object({
  name: z.string().min(5),
  description: z.string().default(''),
  price: z.coerce.number().min(0.01),
  available: z.coerce.boolean().optional(),
  categoryId: z.string(),
  restaurantId: z.string(),
});

const createMenuItemSchema = baseMenuItemSchema.extend({});

const updateMenuItemSchema = baseMenuItemSchema.partial();

const menuItemQuerySchema = basePaginationSchema.extend({
  available: z.coerce.boolean().optional(),
  restaurantId: z.string().optional(),
});

type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
type MenuItemQueryInput = z.infer<typeof menuItemQuerySchema>;

interface GetByIdMenuItemParams {
  itemId: string;
}

export { createMenuItemSchema, menuItemQuerySchema, updateMenuItemSchema };
export type { CreateMenuItemInput, UpdateMenuItemInput, MenuItemQueryInput, GetByIdMenuItemParams };
