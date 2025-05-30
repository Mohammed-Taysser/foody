import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import CONFIG from './config/env';
import apiLimiter from './middleware/apiLimiter.middleware';

import errorHandlerMiddleware from '@/middleware/error.middleware';
import authRoutes from '@/modules/auth/auth.route';
import restaurantRoutes from '@/modules/restaurant/restaurant.route';
import userRoutes from '@/modules/user/user.route';
import { NotFoundError } from '@/utils/errors';

const app = express();

if (CONFIG.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const swaggerDocument = YAML.load('./docs/swagger.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(helmet());

app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy 🚀' });
});

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
