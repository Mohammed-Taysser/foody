import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import { AuthenticatedRequest } from '@/types/import';
import { ForbiddenError } from '@/utils/errors.utils';

function authorizeMiddleware(...roles: User['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const request = req as AuthenticatedRequest;
    const user = request.user;

    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenError('You are not authorized to access this resource');
    }

    next();
  };
}

export default authorizeMiddleware;
