import { Router } from 'express';

import {
  login,
  refreshToken,
  register,
  resetUserPassword,
  sendResetPasswordCode,
  sendVerificationEmail,
  verifyEmailToken,
  verifyResetPasswordToken,
} from './auth.controller';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  sendResetPasswordCodeSchema,
  sendVerificationEmailSchema,
  verifyEmailTokenSchema,
  verifyResetPasswordTokenSchema,
} from './auth.validator';

import ZodValidate from '@/middleware/zod-validate.middleware';

const router = Router();

router.post('/register', ZodValidate(registerSchema), register);
router.post('/login', ZodValidate(loginSchema), login);
router.post('/refresh-token', ZodValidate(refreshTokenSchema), refreshToken);
router.post('/reset-password', ZodValidate(resetPasswordSchema), resetUserPassword);
router.post(
  '/send-reset-password-code',
  ZodValidate(sendResetPasswordCodeSchema),
  sendResetPasswordCode
);
router.post(
  '/verify-reset-password',
  ZodValidate(verifyResetPasswordTokenSchema),
  verifyResetPasswordToken
);
router.post(
  '/send-verification-email',
  ZodValidate(sendVerificationEmailSchema),
  sendVerificationEmail
);
router.post('/verify-email', ZodValidate(verifyEmailTokenSchema), verifyEmailToken);

export default router;
