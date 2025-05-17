import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';

import { ForbiddenError } from '@/utils/errors';
import { AuthenticatedRequest } from '@/types/import';

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
