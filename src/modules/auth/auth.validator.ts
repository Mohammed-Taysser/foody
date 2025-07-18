import { z } from 'zod';

const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(100),
    password: z.string().trim().min(6).max(100),
    role: z.enum(['ADMIN', 'OWNER', 'CUSTOMER']).default('CUSTOMER'),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().trim().email().max(100),
    password: z.string().trim().min(6).max(100),
  }),
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().trim(),
  }),
};

const sendResetPasswordCodeSchema = {
  body: z.object({
    email: z.string().trim().email().max(100),
  }),
};

const verifyResetPasswordTokenSchema = {
  body: z.object({
    email: z.string().trim().email().max(100),
    resetToken: z.string().trim(),
    password: z.string().trim().min(6).max(100),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    email: z.string().trim().email().max(100),
    password: z.string().trim().min(6).max(100),
  }),
};

const sendVerificationEmailSchema = {
  body: z.object({
    email: z.string().trim().email().max(100),
  }),
};

const verifyEmailTokenSchema = {
  body: z.object({
    verificationToken: z.string().trim(),
    email: z.string().trim().email().max(100),
  }),
};

type RegisterInput = z.infer<typeof registerSchema.body>;
type LoginInput = z.infer<typeof loginSchema.body>;
type RefreshTokenInput = z.infer<typeof refreshTokenSchema.body>;
type SendResetPasswordCodeInput = z.infer<typeof sendResetPasswordCodeSchema.body>;
type VerifyResetPasswordTokenInput = z.infer<typeof verifyResetPasswordTokenSchema.body>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema.body>;
type SendVerificationEmailInput = z.infer<typeof sendVerificationEmailSchema.body>;
type VerifyEmailTokenInput = z.infer<typeof verifyEmailTokenSchema.body>;

const authValidator = {
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

export default authValidator;
