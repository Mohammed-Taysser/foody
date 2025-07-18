import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import type {
  CreatePermissionGroupInput,
  GetPermissionGroupByIdParams,
  GetPermissionGroupListQuery,
} from './permission.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';

async function getPermissionGroups(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetPermissionGroupListQuery
  >;
  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.PermissionGroupWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  const [data, total] = await Promise.all([
    prisma.permissionGroup.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
    }),
    prisma.permissionGroup.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'Paginated permission groups',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getPermissionGroupList(request: Request, response: Response) {
  const permissions = await prisma.permissionGroup.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendSuccessResponse({
    response,
    message: 'All permissions groups',
    data: permissions,
  });
}

async function getPermissionGroupById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetPermissionGroupByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { permissionGroupId } = authenticatedRequest.params;

  const permission = await prisma.permissionGroup.findUnique({
    where: { id: permissionGroupId },
  });

  if (!permission) {
    throw new NotFoundError('Permission group not found');
  }

  sendSuccessResponse({
    response,
    message: 'Permission group found',
    data: permission,
  });
}

async function createPermissionGroup(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    CreatePermissionGroupInput
  >;

  const existingGroup = await prisma.permissionGroup.findUnique({
    where: { name: authenticatedRequest.body.name },
  });

  if (existingGroup) {
    throw new Error('Permission group already exists');
  }

  const permission = await prisma.permissionGroup.create({
    data: authenticatedRequest.body,
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'PERMISSION_GROUP',
    resourceId: permission.id,
    metadata: { data: request.body },
  });

  sendSuccessResponse({
    response,
    message: 'Permission group created',
    data: permission,
    statusCode: 201,
  });
}

async function updatePermissionGroup(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;

  const { permissionGroupId } = request.params;
  const { name, description } = request.body;

  const permission = await prisma.permissionGroup.findUnique({
    where: { id: permissionGroupId },
  });

  if (!permission) {
    throw new NotFoundError('Permission group not found');
  }

  const updatedPermission = await prisma.permissionGroup.update({
    where: { id: permissionGroupId },
    data: { name, description },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'PERMISSION_GROUP',
    oldData: { name: updatedPermission.name, description: updatedPermission.description },
    newData: { name, description },
    resourceId: updatedPermission.id,
    metadata: { permission: updatedPermission },
  });

  sendSuccessResponse({
    response,
    message: 'Permission group updated',
    data: updatedPermission,
  });
}

async function deletePermissionGroup(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;

  const { permissionGroupId } = request.params;

  const permission = await prisma.permissionGroup.findUnique({
    where: { id: permissionGroupId },
  });

  if (!permission) {
    throw new NotFoundError('Permission group not found');
  }

  const deletedGroupPermission = await prisma.permissionGroup.delete({
    where: { id: permissionGroupId },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'PERMISSION_GROUP',
    resourceId: permission.id,
    metadata: { deletedGroupPermission },
  });

  sendSuccessResponse({
    response,
    message: 'Permission group deleted',
    data: deletedGroupPermission,
  });
}

const permissionGroupController = {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroupById,
  getPermissionGroupList,
  getPermissionGroups,
  updatePermissionGroup,
};

export default permissionGroupController;
