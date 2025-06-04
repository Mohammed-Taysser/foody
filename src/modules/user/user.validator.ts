import { z } from 'zod';

const baseUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// createUserSchema includes password and optional role
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).optional(),
});

// updateProfileSchema makes all fields optional
const updateProfileSchema = baseUserSchema.partial();

export { createUserSchema, updateProfileSchema };
