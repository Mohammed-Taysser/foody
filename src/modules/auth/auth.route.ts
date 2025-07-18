import { Router } from 'express';

import controller from './auth.controller';
import validator from './auth.validator';

import validateRequest from '@/middleware/validate-request.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import authorizeMiddleware from '@/middleware/authorize.middleware';
import authenticateMiddleware from '@/middleware/authenticate.middleware';

const router = Router();

router.post('/register', validateRequest(validator.registerSchema), controller.register);
router.post('/login', validateRequest(validator.loginSchema), controller.login);
router.post(
  '/refresh-token',
  validateRequest(validator.refreshTokenSchema),
  controller.refreshToken
);
router.post(
  '/reset-password',
  authenticateMiddleware,
  authorizeMiddleware('ADMIN'),
  requirePermission(['update:user']),
  validateRequest(validator.resetPasswordSchema),
  controller.resetUserPassword
);
router.post(
  '/send-reset-password-code',
  validateRequest(validator.sendResetPasswordCodeSchema),
  controller.sendResetPasswordCode
);
router.post(
  '/verify-reset-password',
  validateRequest(validator.verifyResetPasswordTokenSchema),
  controller.verifyResetPasswordToken
);
router.post(
  '/send-verification-email',
  validateRequest(validator.sendVerificationEmailSchema),
  controller.sendVerificationEmail
);
router.post(
  '/verify-email',
  validateRequest(validator.verifyEmailTokenSchema),
  controller.verifyEmailToken
);

export default router;
