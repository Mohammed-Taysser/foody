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
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function getUserPermission(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;

  const user = authenticatedRequest.user;

  const effectivePermissions = new Set([
    ...user.permissions.map((p) => p.key),
    ...user.permissionGroups.flatMap((g) => g.permissions.map((p) => p.key)),
  ]);

  const serializedPermissions = Array.from(effectivePermissions)
    .map((permission) => permission.split(':'))
    .map(([action, module]) => ({ action, module }));

  sendSuccessResponse({
    response,
    message: 'User permissions',
    data: serializedPermissions,
  });
}

async function getUsers(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All users',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getUsersList(request: Request, response: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendSuccessResponse({ response, message: 'Users list', data: users });
}

async function getUserById(request: Request, response: Response) {
  const userId = request.params.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  sendSuccessResponse({
    response,
    message: 'User found',
    data: user,
  });
}

async function getProfile(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;

  const user = authenticatedRequest.user;

  sendSuccessResponse({
    response,
    message: 'Current user',
    data: user,
  });
}

async function createUser(request: Request, response: Response) {
  const data = request.body;

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
    request: request,
    actorId: newUser.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'USER',
    resourceId: newUser.id,
    metadata: { data },
  });

  sendSuccessResponse({
    response,
    message: 'User created',
    data: newUser,
    statusCode: 201,
  });
}

async function updateUser(request: Request, response: Response) {
  const userId = request.params.userId;
  const data = request.body;

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
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'USER',
    resourceId: user.id,
    metadata: { data },
  });

  sendSuccessResponse({
    response,
    message: 'User updated',
    data: updatedUser,
  });
}

async function updateMe(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    UpdateUserInput
  >;
  const user = authenticatedRequest.user;

  if (authenticatedRequest.body.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: authenticatedRequest.body.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError('Email already registered');
    }
  }

  let imageUrl = undefined;

  if (user.image && request.file) {
    deleteImage(user.image);
  }

  if (authenticatedRequest.file) {
    imageUrl = await uploadImage(authenticatedRequest.file, 'user');
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...authenticatedRequest.body,
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
    request: authenticatedRequest,
  });

  sendSuccessResponse({
    response,
    message: 'User profile updated',
    data: updatedUser,
  });
}

async function deleteUser(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdUserParams,
    unknown,
    unknown,
    unknown
  >;

  const userId = authenticatedRequest.params.userId;

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
    request: authenticatedRequest,
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'USER',
    resourceId: user.id,
  });

  sendSuccessResponse({
    response,
    message: 'User deleted',
    data: deletedUser,
  });
}

export {
  createUser,
  deleteUser,
  getProfile,
  getUserById,
  getUserPermission,
  getUsers,
  getUsersList,
  updateMe,
  updateUser,
};
