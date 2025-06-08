import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError } from '@/utils/errors.utils';

type RequestPart = 'body' | 'query' | 'params';

function ZodValidate(schema: ZodSchema, source: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const request = req as AuthenticatedRequest;
    try {
      const result = schema.parse(request[source]);
      request.parsedQuery = request.parsedQuery ?? {};

      if (source !== 'query') {
        request[source] = result; // override with parsed+typed data
      } else {
        request.parsedQuery = result;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestError(err.errors);
      }

      next(err);
    }
  };
}

export default ZodValidate;
