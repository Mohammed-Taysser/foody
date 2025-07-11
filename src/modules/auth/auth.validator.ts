import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
  role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).default('CUSTOMER'),
});

const loginSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const sendResetPasswordCodeSchema = z.object({
  email: z.string().email().max(100),
});

const verifyResetPasswordTokenSchema = z.object({
  email: z.string().email().max(100),
  resetToken: z.string(),
  password: z.string().min(6).max(100),
});

const resetPasswordSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
});

const sendVerificationEmailSchema = z.object({
  email: z.string().email().max(100),
});

const verifyEmailTokenSchema = z.object({
  verificationToken: z.string(),
  email: z.string().email().max(100),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
type SendResetPasswordCodeInput = z.infer<typeof sendResetPasswordCodeSchema>;
type VerifyResetPasswordTokenInput = z.infer<typeof verifyResetPasswordTokenSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type SendVerificationEmailInput = z.infer<typeof sendVerificationEmailSchema>;
type VerifyEmailTokenInput = z.infer<typeof verifyEmailTokenSchema>;

export {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  sendResetPasswordCodeSchema,
  sendVerificationEmailSchema,
  verifyEmailTokenSchema,
  verifyResetPasswordTokenSchema,
};
export type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  SendResetPasswordCodeInput,
  SendVerificationEmailInput,
  VerifyEmailTokenInput,
  VerifyResetPasswordTokenInput,
};
