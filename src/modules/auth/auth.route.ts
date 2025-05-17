import { Router } from 'express';

import { register, login } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validator';

import ZodValidate from '@/middleware/validateRequest';

const router = Router();

router.post('/register', ZodValidate(registerSchema), register);
router.post('/login', ZodValidate(loginSchema), login);

export default router;
