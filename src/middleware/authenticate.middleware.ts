import { NextFunction, Request, Response } from 'express';

import prisma from '@/config/prisma';
import { verifyToken } from '@/modules/auth/auth.service';
import { AuthenticatedRequest } from '@/types/import';
import { UnauthorizedError } from '@/utils/errors';

async function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new UnauthorizedError('Invalid token');
  }

  if (typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: decoded.id,
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid token');
  }

  request.user = user;
  next();
}

export default authenticateMiddleware;
