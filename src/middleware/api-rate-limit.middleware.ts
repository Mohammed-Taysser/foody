import rateLimit from 'express-rate-limit';

import { TooManyRequestsError } from '@/utils/errors.utils';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  standardHeaders: true,
  handler: () => {
    throw new TooManyRequestsError();
  },
});

export default apiLimiter;
