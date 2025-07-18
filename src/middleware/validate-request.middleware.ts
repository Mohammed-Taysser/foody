import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

import { BadRequestError } from '@/utils/errors.utils';
import { AuthenticatedRequest } from '@/types/import';

interface Schemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

function validateRequest(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const request = req as AuthenticatedRequest;

    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(request.body ?? {});
        if (!result.success) {
          throw result.error;
        }
        request.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(request.query);
        if (!result.success) {
          throw result.error;
        }
        request.parsedQuery = result.data;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(request.params);
        if (!result.success) {
          throw result.error;
        }
        request.params = result.data;
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

export default validateRequest;
