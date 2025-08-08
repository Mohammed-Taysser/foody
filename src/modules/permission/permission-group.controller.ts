import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import type {
  CreatePermissionGroupInput,
  ExportPermissionGroupsQuery,
  GetPermissionGroupByIdParams,
  GetPermissionGroupListQuery,
} from './permission.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import exportService from '@/services/export.service';
import formatterService from '@/services/formatter.service';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
import { getRequestInfo } from '@/utils/request.utils';
import {
  sendCSVResponse,
  sendExcelResponse,
  sendPaginatedResponse,
  sendPDFResponse,
  sendSuccessResponse,
} from '@/utils/response.utils';

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

async function exportPermissionGroups(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    ExportPermissionGroupsQuery
  >;

  const { parsedQuery: query } = authenticatedRequest;

  const format = query.format;

  const filters: Prisma.PermissionGroupWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  const permissionGroupsResponse = await prisma.permissionGroup.findMany({
    orderBy: { createdAt: 'desc' },
    where: filters,
  });

  const permissionGroup = permissionGroupsResponse.map((group, index) => ({
    '#': index + 1,
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: formatterService.formatDateTime(group.createdAt),
  }));

  switch (format) {
    case 'csv': {
      const csv = exportService.toCSV(permissionGroup);

      sendCSVResponse(response, csv, 'Permission Groups');
      break;
    }

    case 'xlsx': {
      const buffer = await exportService.toExcel(permissionGroup);

      sendExcelResponse(response, buffer, 'Permission Groups');
      break;
    }

    case 'pdf': {
      response.attachment('Permission Groups.pdf');
      const pdfBuffer = await exportService.toPDF(permissionGroup, {
        title: 'Permission Groups',
      });

      sendPDFResponse(response, pdfBuffer, 'Permission Groups');
      break;
    }
  }

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'EXPORT',
    resource: 'PERMISSION_GROUP',
    metadata: { format, query },
  });
}

const permissionGroupController = {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroupById,
  getPermissionGroupList,
  getPermissionGroups,
  updatePermissionGroup,
  exportPermissionGroups,
};

export default permissionGroupController;
