import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';

import apiLimiter from './middleware/apiLimiter.middleware';

import errorHandlerMiddleware from '@/middleware/error.middleware';
import { NotFoundError } from '@/utils/errors';
import authRoutes from '@/modules/auth/auth.route';
import userRoutes from '@/modules/user/user.route';
import restaurantRoutes from '@/modules/restaurant/restaurant.route';

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

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
