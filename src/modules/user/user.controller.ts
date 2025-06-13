import { Role } from '@prisma/client';
import { Request, Response } from 'express';

import { DEFAULT_ROLE_PERMISSIONS } from '../auth/auth.constant';

import { GetByIdUserParams, UpdateUserInput } from './user.validator';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import sendResponse from '@/utils/sendResponse';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function updateMe(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<unknown, unknown, UpdateUserInput>;
  const user = request.user;

  if (request.body.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: request.body.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError('Email already registered');
    }
  }

  let imageUrl = undefined;

  if (user.image && req.file) {
    deleteImage(user.image);
  }

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'user');
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...request.body,
      image: imageUrl,
    },
  });

  const oldUserData = {
    name: user.name,
    email: user.email,
    role: user.role,
  };

  DATABASE_LOGGER.log({
    actorId: user.id,
    action: 'UPDATE',
    actorType: 'USER',
    resource: 'USER',
    resourceId: user.id,
    oldData: oldUserData,
    newData: updatedUser,
    request,
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

async function getUserPermission(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const user = request.user;

  const effectivePermissions = new Set([
    ...user.permissions.map((p) => p.key),
    ...user.permissionGroups.flatMap((g) => g.permissions.map((p) => p.key)),
  ]);

  const serializedPermissions = Array.from(effectivePermissions)
    .map((permission) => permission.split(':'))
    .map(([action, module]) => ({ action, module }));

  sendResponse({
    res,
    message: 'User permissions',
    data: serializedPermissions,
  });
}

async function getUsers(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;

  const query = request.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: query.limit,
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
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
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

  const config = DEFAULT_ROLE_PERMISSIONS[data.role as Role];

  let imageUrl = undefined;

  if (data.image) {
    imageUrl = await uploadImage(data.image, 'user');
  }

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
      permissionGroups: {
        connect: config.groups.map((name) => ({ name })),
      },
      permissions: {
        connect: config.permissions.map((id) => ({ key: id })),
      },
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    request: req,
    actorId: newUser.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'USER',
    resourceId: newUser.id,
    metadata: { data },
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

  let imageUrl = undefined;

  if (data.image) {
    imageUrl = await uploadImage(data.image, 'user');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    request: req,
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'USER',
    resourceId: user.id,
    metadata: { data },
  });

  sendResponse({
    res,
    message: 'User updated',
    data: updatedUser,
  });
}

async function deleteUser(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    GetByIdUserParams,
    unknown,
    unknown,
    unknown
  >;

  const userId = request.params.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const deletedUser = await prisma.user.delete({
    where: { id: userId },
  });

  if (deletedUser.image) {
    deleteImage(deletedUser.image);
  }

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'USER',
    resourceId: user.id,
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
  getUserPermission,
  getUsers,
  getUsersList,
  updateMe,
  updateUser,
};
