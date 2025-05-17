import { Request, Response } from 'express';

import { updateProfileSchema } from './user.validator';

import sendResponse from '@/utils/sendResponse';
import { AuthenticatedRequest } from '@/types/import';
import { UnauthorizedError } from '@/utils/errors';

async function updateMe(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const user = request.user;

  if (!user) {
    throw new UnauthorizedError('Unauthorized: no user found in request');
  }

  const data = updateProfileSchema.parse(req.body);

  // 🔧 Replace this with real DB update logic later
  const updatedUser = {
    id: user.userId,
    email: data.email || user.email,
    name: data.name || 'John Doe',
  };

  sendResponse({
    res,
    message: 'User profile updated',
    data: updatedUser,
  });
}

export { updateMe };
