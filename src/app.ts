import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { default as CONFIG, default as ennValidation } from '@/config/env';
import apiLimiter from '@/middleware/api-rate-limit.middleware';
import compressionMiddleware from '@/middleware/compression.middleware';
import errorHandlerMiddleware from '@/middleware/error.middleware';
import loggerMiddleware from '@/middleware/logger.middleware';
import authRoutes from '@/modules/auth/auth.route';
import restaurantRoutes from '@/modules/restaurant/restaurant.route';
import userRoutes from '@/modules/user/user.route';
import { ForbiddenError, NotFoundError } from '@/utils/errors.utils';

const app = express();

if (ennValidation.NODE_ENV !== 'test') {
  app.use(loggerMiddleware);
}

// Load swagger document with absolute path
const swaggerDocument = YAML.load('./docs/swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Make sure the body is parsed beforehand.
app.use(hpp());

// secure apps by setting various HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// enable CORS - Cross Origin Resource Sharing
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ForbiddenError(`CORS: Origin ${origin} is not allowed`));
      }
    },
  })
);

// parse body params and attache them to req.body
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(express.json({ limit: '30mb' }));

// Compress all HTTP responses
app.use(compressionMiddleware);

// Serve static Files
app.use(express.static('public'));

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy 🚀' });
});

// API rate limiter
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);

// 404 Handler
app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

// Global Error Handler (last)
app.use(errorHandlerMiddleware);

export default app;
