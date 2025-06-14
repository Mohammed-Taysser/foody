import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).default('CUSTOMER'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export { loginSchema, refreshTokenSchema, registerSchema };
export type { LoginInput, RefreshTokenInput, RegisterInput };
