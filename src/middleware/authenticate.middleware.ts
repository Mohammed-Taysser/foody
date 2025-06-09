import { NextFunction, Request, Response } from 'express';

import prisma from '@/config/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { UnauthorizedError } from '@/utils/errors.utils';

async function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  const decoded = tokenService.verifyToken(token);

  if (!decoded) {
    throw new UnauthorizedError('Invalid token');
  }

  if (typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: {
      permissions: true,
      permissionGroups: { include: { permissions: true } },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid token');
  }

  request.user = user;
  next();
}

export default authenticateMiddleware;
