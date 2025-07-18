import { z } from 'zod';

import basePaginationSchema from '@/validations/base.validation';

const getPermissionListSchema = {
  query: basePaginationSchema.extend({
    key: z.string().trim().max(100).optional(),
  }),
};

const getPermissionByIdSchema = {
  params: z.object({
    permissionId: z.string().trim().max(100),
  }),
};

const createPermissionSchema = {
  body: z.object({
    key: z.string().trim().min(2).max(100),
    description: z.string().trim().max(200).default(''),
  }),
};
const updatePermissionSchema = {
  params: z.object({
    permissionId: z.string().trim().max(100),
  }),
  body: z.object({
    key: z.string().trim().min(2).max(100),
    description: z.string().trim().max(200).default(''),
  }),
};

const getPermissionGroupListSchema = {
  query: basePaginationSchema.extend({
    name: z.string().trim().max(100).optional(),
  }),
};

const getPermissionGroupByIdSchema = {
  params: z.object({
    permissionGroupId: z.string().trim().max(100),
  }),
};

const createPermissionGroupSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(200).default(''),
  }),
};
const updatePermissionGroupSchema = {
  params: z.object({
    permissionGroupId: z.string().trim().max(100),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(200).default(''),
  }),
};

type CreatePermissionInput = z.infer<typeof createPermissionSchema.body>;
type UpdatePermissionInput = z.infer<typeof updatePermissionSchema.body>;
type GetPermissionListQuery = z.infer<typeof getPermissionListSchema.query>;
type GetPermissionByIdParams = z.infer<typeof getPermissionByIdSchema.params>;

type CreatePermissionGroupInput = z.infer<typeof createPermissionGroupSchema.body>;
type UpdatePermissionGroupInput = z.infer<typeof updatePermissionGroupSchema.body>;
type GetPermissionGroupListQuery = z.infer<typeof getPermissionGroupListSchema.query>;
type GetPermissionGroupByIdParams = z.infer<typeof getPermissionGroupByIdSchema.params>;

const permissionValidator = {
  createPermissionGroupSchema,
  createPermissionSchema,
  updatePermissionGroupSchema,
  updatePermissionSchema,
  getPermissionListSchema,
  getPermissionByIdSchema,
  getPermissionGroupListSchema,
  getPermissionGroupByIdSchema,
};

export type {
  CreatePermissionGroupInput,
  CreatePermissionInput,
  GetPermissionByIdParams,
  GetPermissionGroupByIdParams,
  GetPermissionGroupListQuery,
  GetPermissionListQuery,
  UpdatePermissionGroupInput,
  UpdatePermissionInput,
};

export default permissionValidator;
