import { Router } from 'express';

import { getProfile, login, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validator';

import ZodValidate from '@/middleware/ZodValidate.middleware';
import authenticateMiddleware from '@/middleware/authenticate.middleware';

const router = Router();

router.post('/register', ZodValidate(registerSchema), register);
router.post('/login', ZodValidate(loginSchema), login);
router.get('/me', authenticateMiddleware, getProfile);

export default router;
