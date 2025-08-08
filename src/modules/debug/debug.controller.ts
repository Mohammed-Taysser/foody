import { RequestHandler } from 'express';

import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors.utils';
import CONFIG from '@/apps/config';

type QueryType =
  | 'bad-request'
  | 'validation-object'
  | 'validation-array'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found';

const simulateError: RequestHandler<unknown, unknown, unknown, { type: QueryType }> = async (
  request
) => {
  const type = request.query.type;

  switch (type) {
    case 'bad-request':
      throw new BadRequestError();

    case 'validation-object':
      throw new BadRequestError({ email: 'Invalid email', name: 'Required' });

    case 'validation-array':
      throw new BadRequestError([
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ]);

    case 'unauthorized':
      throw new UnauthorizedError();

    case 'forbidden':
      throw new ForbiddenError();

    case 'not-found':
      throw new NotFoundError();

    default:
      throw new Error('Simulated unhandled error');
  }
};

const getEnv: RequestHandler = async (request, response) => {
  response.json(CONFIG);
};

const debugController = {
  simulateError,
  getEnv,
};

export default debugController;
