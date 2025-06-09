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

export {
  createPermissionGroupSchema,
  createPermissionSchema,
  updatePermissionGroupSchema,
  updatePermissionSchema,
};
