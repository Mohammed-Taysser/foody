import { z } from 'zod';

import { zodBoolean } from '@/utils/zod-utils';
import { basePaginationSchema } from '@/validations/base.validation';

const createMenuItemSchema = {
  body: z.object({
    name: z.string().trim().min(5).max(100),
    description: z.string().trim().max(2200).default(''),
    price: z.coerce.number().min(0.01),
    available: z.coerce.boolean(),
    categoryId: z.string().trim().max(100),
    restaurantId: z.string().trim().max(100),
  }),
};

const updateMenuItemSchema = {
  body: z.object({
    name: z.string().trim().min(5).max(100).optional(),
    description: z.string().trim().max(2200).default('').optional(),
    price: z.coerce.number().min(0.01).optional(),
    available: z.coerce.boolean().optional(),
    categoryId: z.string().trim().max(100).optional(),
    restaurantId: z.string().trim().max(100).optional(),
  }),
};

const geyMenuItemByIdSchema = {
  params: z.object({
    menuId: z.string().trim().max(100),
  }),
};

const getMenuItemsSchema = {
  query: basePaginationSchema.extend({
    name: z.string().trim().max(100).optional(),
    available: zodBoolean().optional(),
    restaurantId: z.string().trim().max(100).optional(),
  }),
};

const exportMenuItemsSchema = {
  query: getMenuItemsSchema.query.extend({
    format: z.enum(['csv', 'xlsx', 'pdf']).default('xlsx'),
  }),
};

type CreateMenuItemInput = z.infer<typeof createMenuItemSchema.body>;
type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema.body>;
type GetMenuItemByIdParams = z.infer<typeof geyMenuItemByIdSchema.params>;
type GetMenuItemQuery = z.infer<typeof getMenuItemsSchema.query>;
type ExportMenuItemQuery = z.infer<typeof exportMenuItemsSchema.query>;

const menuItemValidator = {
  createMenuItemSchema,
  getMenuItemsSchema,
  updateMenuItemSchema,
  geyMenuItemByIdSchema,
  exportMenuItemsSchema,
};

export default menuItemValidator;
export type {
  CreateMenuItemInput,
  GetMenuItemByIdParams,
  GetMenuItemQuery,
  UpdateMenuItemInput,
  ExportMenuItemQuery,
};
