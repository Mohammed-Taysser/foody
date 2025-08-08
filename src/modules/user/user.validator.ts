import { UserRole } from '@prisma/client';
import { z } from 'zod';

import { zodBoolean, zodParseEnumList } from '@/utils/zod-utils';
import { basePaginationSchema, dateRangeSchema } from '@/validations/base.validation';

const getUsersListSchema = {
  query: basePaginationSchema.extend({
    name: z.string().trim().min(3).max(100).optional(),
    role: zodParseEnumList<UserRole>(['ADMIN', 'OWNER', 'CUSTOMER']).optional(),
    email: z.string().trim().max(100).optional(),
    failedLoginAttempts: z.coerce.number().min(0).max(50).optional(),
    lastFailedLogin: dateRangeSchema.optional(),
    isEmailVerified: zodBoolean().optional(),
    isPhoneVerified: zodBoolean().optional(),
    isActive: zodBoolean().optional(),
    maxTokens: z.coerce.number().min(0).max(100).optional(),
    isBlocked: zodBoolean().optional(),
    blockedAt: dateRangeSchema.optional(),
    blockedById: z.string().min(5).max(100).optional(),
    createdAt: dateRangeSchema.optional(),
  }),
};

const getUserByIdSchema = {
  params: z.object({
    userId: z.string().trim().min(5).max(100),
  }),
};

const createUserSchema = {
  body: z.object({
    name: z.string().trim().min(5).max(100),
    email: z.string().trim().email().max(100),
    password: z.string().trim().min(6).max(100),
    role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).optional().default('CUSTOMER'),
  }),
};

const updateUserSchema = {
  body: z.object({
    name: z.string().trim().min(5).max(100).optional(),
    email: z.string().trim().email().max(100).optional(),
    role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).optional(),
  }),
};

const updateMeSchema = {
  body: z.object({
    name: z.string().trim().min(5).max(100).optional(),
    email: z.string().trim().email().max(100).optional(),
  }),
};

const exportUsersQuery = {
  query: getUsersListSchema.query.extend({
    format: z.enum(['csv', 'xlsx', 'pdf']).default('xlsx'),
  }),
};

type CreateUserInput = z.infer<typeof createUserSchema.body>;
type UpdateUserInput = z.infer<typeof updateUserSchema.body>;
type UpdateMeInput = z.infer<typeof updateMeSchema.body>;
type GetUsersListQuery = z.infer<typeof getUsersListSchema.query>;
type GetUserByIdParams = z.infer<typeof getUserByIdSchema.params>;
type ExportUsersQuery = z.infer<typeof exportUsersQuery.query>;

const userValidator = {
  createUserSchema,
  updateUserSchema,
  getUsersListSchema,
  getUserByIdSchema,
  updateMeSchema,
  exportUsersQuery,
};

export type {
  CreateUserInput,
  GetUserByIdParams,
  GetUsersListQuery,
  UpdateUserInput,
  UpdateMeInput,
  ExportUsersQuery,
};

export default userValidator;
