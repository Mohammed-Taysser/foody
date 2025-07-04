import { z } from 'zod';

const basePermissionSchema = z.object({
  key: z.string().min(2),
  description: z.string().default(''),
});

const basePermissionGroupSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(''),
});

const createPermissionSchema = basePermissionSchema.extend({});
const updatePermissionSchema = basePermissionSchema.partial();

const createPermissionGroupSchema = basePermissionGroupSchema.extend({});
const updatePermissionGroupSchema = basePermissionGroupSchema.partial();

type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
type CreatePermissionGroupInput = z.infer<typeof createPermissionGroupSchema>;
type UpdatePermissionGroupInput = z.infer<typeof updatePermissionGroupSchema>;

interface GetByIdPermissionParams {
  permissionId: string;
}

export {
  createPermissionGroupSchema,
  createPermissionSchema,
  updatePermissionGroupSchema,
  updatePermissionSchema,
};

export type {
  CreatePermissionGroupInput,
  CreatePermissionInput,
  GetByIdPermissionParams,
  UpdatePermissionGroupInput,
  UpdatePermissionInput,
};
