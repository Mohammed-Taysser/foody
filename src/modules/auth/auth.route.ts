import { Router } from 'express';

import { register, login, getProfile } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validator';

import ZodValidate from '@/middleware/validateRequest';
import authenticateMiddleware from '@/middleware/auth.middleware';

const router = Router();

router.post('/register', ZodValidate(registerSchema), register);
router.post('/login', ZodValidate(loginSchema), login);
router.get('/me', authenticateMiddleware, getProfile);

export default router;
