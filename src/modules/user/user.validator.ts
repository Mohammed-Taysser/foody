import { z } from 'zod';

const baseUserSchema = z.object({
  name: z.string().min(5),
  email: z.string().email(),
});

// createUserSchema includes password and optional role
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).default('CUSTOMER'),
});

// updateProfileSchema makes all fields optional
const updateUserSchema = baseUserSchema.partial();

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

interface GetByIdUserParams {
  userId: string;
}

export { createUserSchema, updateUserSchema };

export type { CreateUserInput, UpdateUserInput, GetByIdUserParams };
