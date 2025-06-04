import { Request, Response } from 'express';

import { updateProfileSchema } from './user.validator';

import prisma from '@/config/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function updateMe(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const user = request.user;

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

async function getUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany();

  sendResponse({
    res,
    message: 'All users',
    data: users,
  });
}

async function getUser(req: Request, res: Response) {
  const userId = req.params.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  sendResponse({
    res,
    message: 'User found',
    data: user,
  });
}

async function createUser(req: Request, res: Response) {
  const data = req.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user) {
    throw new ConflictError('Email already registered');
  }

  const hashed = await tokenService.hash(data.password);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
    },
  });

  sendResponse({
    res,
    message: 'User created',
    data: newUser,
    statusCode: 201,
  });
}

async function updateUser(req: Request, res: Response) {
  const userId = req.params.userId;
  const data = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
  });

  sendResponse({
    res,
    message: 'User updated',
    data: updatedUser,
  });
}

async function deleteUser(req: Request, res: Response) {
  const userId = req.params.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  sendResponse({
    res,
    message: 'User deleted',
  });
}

export { createUser, deleteUser, getProfile, getUser, getUsers, updateMe, updateUser };
