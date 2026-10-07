import { ErrorRequestHandler } from 'express';

import CONFIG from '@/apps/config';
import { BaseError } from '@/utils/errors.utils';

interface ErrorBody {
  success: boolean;
  error: string;
  stack?: string;
  path?: string;
  method?: string;
}

const errorHandlerMiddleware: ErrorRequestHandler = (
  err,
  request,
  response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next
) => {
  const status = err instanceof BaseError ? err.statusCode : 500;
  let errorContent = request.t('errors:internal-server-error');

  if (err instanceof BaseError) {
    try {
      const parsedError = JSON.parse(err.message);

      if (typeof parsedError === 'string') {
        errorContent = request.t(parsedError);
      } else {
        errorContent = parsedError;
      }
    } catch {
      errorContent = request.t(err.message);
    }
  }

  const body: ErrorBody = {
    success: false,
    error: errorContent,
  };

  if (CONFIG.NODE_ENV === 'development') {
    body.stack = err.stack;
    body.path = request.originalUrl;
    body.method = request.method;
  }

  response.status(status).json(body);
};

export default errorHandlerMiddleware;
