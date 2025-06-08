import { NextFunction, Request, Response } from 'express';

import CONFIG from '@/config/config';
import { ErrorMiddlewareResponse } from '@/types/error';
import { BaseError } from '@/utils/errors.utils';

function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const status = err instanceof BaseError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  const details = err instanceof BaseError ? err.details : undefined;

  const body: ErrorMiddlewareResponse = {
    success: false,
    message,
    details,
  };

  if (CONFIG.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

export default errorHandlerMiddleware;
