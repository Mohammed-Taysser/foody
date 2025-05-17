import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { BadRequestError } from '@/utils/errors';

type RequestPart = 'body' | 'query' | 'params';

function ZodValidate(schema: ZodSchema, source: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result; // override with parsed+typed data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.errors;
        const messages = issues.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new BadRequestError(`Validation failed:\n${messages.join('\n')}`);
      }

      next(err);
    }
  };
}

export default ZodValidate;
