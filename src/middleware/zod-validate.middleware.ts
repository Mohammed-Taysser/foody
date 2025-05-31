import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { BadRequestError } from '@/utils/errors.utils';

type RequestPart = 'body' | 'query' | 'params';

function ZodValidate(schema: ZodSchema, source: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result; // override with parsed+typed data
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
