import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import {
  CreatePermissionInput,
  GetPermissionByIdParams,
  GetPermissionListQuery,
  UpdatePermissionInput,
} from './permission.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError } from '@/utils/errors.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';

async function getPermissions(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetPermissionListQuery
  >;
  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.PermissionWhereInput = {};

  if (query.key) {
    filters.key = {
      contains: query.key,
      mode: 'insensitive',
    };
  }

  const [data, total] = await Promise.all([
    prisma.permission.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
    }),
    prisma.permission.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'Paginated permissions',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getPermissionList(request: Request, response: Response) {
  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      key: true,
    },
  });

  const renamed = permissions.map(({ id, key }) => ({
    id,
    name: key,
  }));

  sendSuccessResponse({
    response,
    message: 'All permissions',
    data: renamed,
  });
}

async function getPermissionById(request: Request, response: Response) {
  const { permissionId } = request.params;

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  sendSuccessResponse({
    response,
    message: 'Permission found',
    data: permission,
  });
}

async function createPermission(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetPermissionByIdParams,
    unknown,
    CreatePermissionInput,
    unknown
  >;

  const existingPermission = await prisma.permission.findUnique({
    where: { key: request.body.key },
  });

  if (existingPermission) {
    throw new ConflictError('Permission already exists');
  }

  const permission = await prisma.permission.create({
    data: request.body,
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'PERMISSION',
    resourceId: permission.id,
    metadata: { data: request.body },
  });

  sendSuccessResponse({
    response,
    message: 'Permission created',
    data: permission,
    statusCode: 201,
  });
}

async function updatePermission(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetPermissionByIdParams,
    unknown,
    UpdatePermissionInput,
    unknown
  >;

  const { permissionId } = authenticatedRequest.params;
  const { key, description } = authenticatedRequest.body;

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  const updatedPermission = await prisma.permission.update({
    where: { id: permissionId },
    data: { key, description },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'PERMISSION',
    oldData: { key: updatedPermission.key, description: updatedPermission.description },
    newData: { key, description },
    resourceId: updatedPermission.id,
    metadata: { permission: updatedPermission },
  });

  sendSuccessResponse({
    response,
    message: 'Permission updated',
    data: updatedPermission,
  });
}

async function deletePermission(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;

  const { permissionId } = request.params;

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  const deletedPermission = await prisma.permission.delete({
    where: { id: permissionId },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'PERMISSION',
    resourceId: permission.id,
    metadata: { deletedPermission },
  });

  sendSuccessResponse({
    response,
    message: 'Permission deleted',
    data: deletedPermission,
  });
}

const permissionController = {
  createPermission,
  deletePermission,
  getPermissionById,
  getPermissionList,
  getPermissions,
  updatePermission,
};

export default permissionController;
