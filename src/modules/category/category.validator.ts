import { z } from 'zod';

import { basePaginationSchema } from '@/validations/base.validation';

const createCategorySchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    restaurantId: z.string().trim().max(100),
  }),
};

const updateCategorySchema = {
  body: z.object({
    name: z.string().trim().max(100).optional(),
    restaurantId: z.string().trim().max(100).optional(),
  }),
};

const getCategoryByIdSchema = {
  params: z.object({
    categoryId: z.string().trim().max(100),
  }),
};

const getCategoriesSchema = {
  query: basePaginationSchema.extend({
    name: z.string().trim().max(100).optional(),
    restaurantId: z.string().trim().max(100).optional(),
  }),
};

const exportCategoriesSchema = {
  query: getCategoriesSchema.query.extend({
    format: z.enum(['csv', 'xlsx', 'pdf']).default('xlsx'),
  }),
};

type CreateCategoryInput = z.infer<typeof createCategorySchema.body>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema.body>;
type GetCategoryByIdParams = z.infer<typeof getCategoryByIdSchema.params>;
type GetCategoriesQuery = z.infer<typeof getCategoriesSchema.query>;
type ExportCategoriesQuery = z.infer<typeof exportCategoriesSchema.query>;

const categoryValidator = {
  createCategorySchema,
  getCategoriesSchema,
  updateCategorySchema,
  getCategoryByIdSchema,
  exportCategoriesSchema,
};

export default categoryValidator;
export type {
  CreateCategoryInput,
  GetCategoriesQuery,
  GetCategoryByIdParams,
  UpdateCategoryInput,
  ExportCategoriesQuery,
};
