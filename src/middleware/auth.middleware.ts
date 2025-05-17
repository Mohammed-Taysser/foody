import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { UnauthorizedError } from '@/utils/errors';
import { AuthenticatedRequest } from '@/types/import';
import CONFIG from '@/config/env';

function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  const decoded = jwt.verify(token, CONFIG.JWT_SECRET);

  request.user = decoded as AuthenticatedUser;
  next();
}

export default authenticateMiddleware;
