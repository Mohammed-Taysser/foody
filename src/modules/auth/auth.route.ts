import { Router } from 'express';

import { getProfile, login, refreshToken, register } from './auth.controller';
import { loginSchema, refreshTokenSchema, registerSchema } from './auth.validator';

import ZodValidate from '@/middleware/ZodValidate.middleware';
import authenticateMiddleware from '@/middleware/authenticate.middleware';

const router = Router();

router.post('/register', ZodValidate(registerSchema), register);
router.post('/login', ZodValidate(loginSchema), login);
router.get('/me', authenticateMiddleware, getProfile);
router.post('/refresh', ZodValidate(refreshTokenSchema), refreshToken);

export default router;
