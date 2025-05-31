import { Router } from 'express';

import { login, refreshToken, register } from './auth.controller';
import { loginSchema, refreshTokenSchema, registerSchema } from './auth.validator';

import ZodValidate from '@/middleware/zod-validate.middleware';

const router = Router();

router.post('/register', ZodValidate(registerSchema), register);
router.post('/login', ZodValidate(loginSchema), login);
router.post('/refresh', ZodValidate(refreshTokenSchema), refreshToken);

export default router;
