import { Router } from 'express';

import { getHealthCheck } from './system.controller';

const router = Router();

router.get('/health', getHealthCheck);

export default router;
