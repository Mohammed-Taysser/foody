import { Request, Response } from 'express';

import { updateProfileSchema } from './user.validator';

import sendResponse from '@/utils/sendResponse';
import { AuthenticatedRequest } from '@/types/import';
import { UnauthorizedError } from '@/utils/errors';
import prisma from '@/config/prisma';

async function updateMe(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const user = request.user;

  if (!user) {
    throw new UnauthorizedError('Unauthorized: no user found in request');
  }

  const data = updateProfileSchema.parse(req.body);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  sendResponse({
    res,
    message: 'User profile updated',
    data: updatedUser,
  });
}

export { updateMe };
