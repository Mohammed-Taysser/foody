import { NextFunction, Request, Response } from 'express';

import { BaseError } from '@/utils/errors';

function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const status = err instanceof BaseError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

export default errorHandlerMiddleware;
