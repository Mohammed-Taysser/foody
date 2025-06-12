import { Router } from 'express';

import { getAnalyticsMetrics } from './analytics.controller';

const router = Router();

router.get('/', getAnalyticsMetrics);

export default router;
