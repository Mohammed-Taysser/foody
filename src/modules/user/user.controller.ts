import { Request, Response } from 'express';

import { updateProfileSchema } from './user.validator';

import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, UnauthorizedError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function updateMe(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const user = request.user;

  if (!user) {
    throw new UnauthorizedError('Unauthorized: no user found in request');
  }

  if (user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError('Email already registered');
    }
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

function getProfile(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const user = request.user;

  if (!user) {
    throw new UnauthorizedError('Not authenticated');
  }

  sendResponse({
    res,
    message: 'Current user',
    data: user,
  });
}

export { getProfile, updateMe };
