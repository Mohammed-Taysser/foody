import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { DEFAULT_ROLE_PERMISSIONS } from '../auth/auth.constant';

import {
  CreateUserInput,
  GetUserByIdParams,
  GetUsersListQuery,
  UpdateMeInput,
  UpdateUserInput,
} from './user.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { buildDateRangeFilter } from '@/utils/dayjs.utils';

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
    GetUsersListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.UserWhereInput = {};

  if (query.role) {
    filters.role = {
      in: query.role,
    };
  }

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  if (query.email) {
    filters.email = {
      contains: query.email,
      mode: 'insensitive',
    };
  }

  if (query.failedLoginAttempts) {
    filters.failedLoginAttempts = {
      equals: query.failedLoginAttempts,
    };
  }

  if (query.lastFailedLogin) {
    filters.lastFailedLogin = {
      ...buildDateRangeFilter(query.lastFailedLogin),
      not: null, // Exclude nulls explicitly
    };
  }

  if (query.isEmailVerified) {
    filters.isEmailVerified = {
      equals: query.isEmailVerified,
    };
  }

  if (query.isPhoneVerified) {
    filters.isPhoneVerified = {
      equals: query.isPhoneVerified,
    };
  }

  if (query.isActive) {
    filters.isActive = {
      equals: query.isActive,
    };
  }

  if (query.isBlocked) {
    filters.isBlocked = {
      equals: query.isBlocked,
    };
  }

  if (query.maxTokens) {
    filters.maxTokens = {
      equals: query.maxTokens,
    };
  }

  if (query.blockedAt) {
    filters.blockedAt = {
      ...buildDateRangeFilter(query.blockedAt),
      not: null, // Exclude nulls explicitly
    };
  }

  if (query.blockedById) {
    filters.blockedById = {
      equals: query.blockedById,
    };
  }

  if (query.createdAt) {
    filters.createdAt = buildDateRangeFilter(query.createdAt);
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
    }),
    prisma.user.count({
      where: filters,
    }),
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
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetUsersListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const filters: Prisma.UserWhereInput = {};

  if (query.role) {
    filters.role = {
      in: query.role,
    };
  }

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  if (query.email) {
    filters.email = {
      contains: query.email,
      mode: 'insensitive',
    };
  }

  if (query.isEmailVerified) {
    filters.isEmailVerified = {
      equals: query.isEmailVerified,
    };
  }

  if (query.isPhoneVerified) {
    filters.isPhoneVerified = {
      equals: query.isPhoneVerified,
    };
  }

  if (query.isActive) {
    filters.isActive = {
      equals: query.isActive,
    };
  }

  if (query.isBlocked) {
    filters.isBlocked = {
      equals: query.isBlocked,
    };
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Users list', data: users });
}

async function getUserById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetUserByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params } = authenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
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
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    CreateUserInput,
    unknown
  >;

  const { body, file: image } = authenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (user) {
    throw new ConflictError('Email already registered');
  }

  const hashed = await tokenService.hash(body.password);

  const config = DEFAULT_ROLE_PERMISSIONS[body.role];

  let imageUrl = undefined;

  if (image) {
    imageUrl = await uploadImage(image, 'user');
  }

  const newUser = await prisma.user.create({
    data: {
      ...body,
      password: hashed,
      permissionGroups: {
        connect: config.groups.map((name) => ({ name })),
      },
      permissions: {
        connect: config.permissions.map((id) => ({ key: id })),
      },
      image: imageUrl,
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: newUser.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'USER',
    resourceId: newUser.id,
    metadata: { body },
    newData: newUser,
  });

  sendSuccessResponse({
    response,
    message: 'User created',
    data: newUser,
    statusCode: 201,
  });
}

async function updateUser(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetUserByIdParams,
    unknown,
    UpdateUserInput,
    unknown
  >;

  const { body, params, file: image } = authenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  let imageUrl = undefined;

  if (image) {
    imageUrl = await uploadImage(image, 'user');
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: {
      ...body,
      image: imageUrl,
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'USER',
    resourceId: user.id,
    metadata: { body },
    oldData: user,
    newData: updatedUser,
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
    UpdateMeInput
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

  databaseLogger.audit({
    actorId: user.id,
    action: 'UPDATE',
    actorType: 'USER',
    resource: 'USER',
    resourceId: user.id,
    oldData: user,
    newData: updatedUser,
    requestInfo: getRequestInfo(authenticatedRequest),
  });

  sendSuccessResponse({
    response,
    message: 'User profile updated',
    data: updatedUser,
  });
}

async function deleteUser(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetUserByIdParams,
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

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
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

const userController = {
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

export default userController;
