import { Router } from 'express';

import { getAnalyticsMetrics, getOrderStatsPerDay } from './analytics.controller';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';

const router = Router();

router.get('/', getAnalyticsMetrics);
router.get('/orders/per-day', authenticate, authorize('ADMIN'), getOrderStatsPerDay);

export default router;
