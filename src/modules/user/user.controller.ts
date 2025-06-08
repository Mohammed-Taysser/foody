import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function updateMe(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const user = request.user;

  if (request.body.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: request.body.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError('Email already registered');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: request.body,
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

  sendResponse({
    res,
    message: 'Current user',
    data: user,
  });
}

async function getUsers(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const query = request.parsedQuery;

  const page = query.page as number;
  const limit = query.limit as number;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  sendResponse({
    res,
    message: 'All users',
    data: {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
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

  const deletedUser = await prisma.user.delete({
    where: { id: userId },
  });

  sendResponse({
    res,
    message: 'User deleted',
    data: deletedUser,
  });
}

async function getUsersList(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  sendResponse({ res, message: 'Users list', data: users });
}

export {
  createUser,
  deleteUser,
  getProfile,
  getUser,
  getUsers,
  getUsersList,
  updateMe,
  updateUser,
};
