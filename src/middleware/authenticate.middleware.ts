import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { UnauthorizedError } from '@/utils/errors';
import { AuthenticatedRequest } from '@/types/import';
import CONFIG from '@/config/env';
import prisma from '@/config/prisma';

async function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  const decoded = jwt.verify(token, CONFIG.JWT_SECRET);

  if (!decoded) {
    throw new UnauthorizedError('Invalid token');
  }

  if (typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid token');
  }

  request.user = user;
  next();
}

export default authenticateMiddleware;
