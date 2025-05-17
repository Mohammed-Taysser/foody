import express from 'express';
import morgan from 'morgan';

import errorHandlerMiddleware from '@/middleware/error.middleware';
import { NotFoundError, UnauthorizedError } from '@/utils/errors';
import sendResponse from '@/utils/sendResponse';

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy 🚀' });
});

// Routes
app.get('/error', () => {
  throw new UnauthorizedError('This is a test error');
});

app.get('/success', (_, res) => {
  sendResponse({ res, message: 'It works!', data: { hello: 'world' } });
});

// 404 Handler
app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

// Global Error Handler (last)
app.use(errorHandlerMiddleware);

export default app;
