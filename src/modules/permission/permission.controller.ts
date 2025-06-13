import { Request, Response } from 'express';

import { GetByIdPermissionParams, UpdatePermissionInput } from './permission.validator';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function listPermissions(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;
  const query = request.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.permission.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.permission.count(),
  ]);

  sendResponse({
    res,
    message: 'Paginated permissions',
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

async function getPermissionList(req: Request, res: Response) {
  const permissions = await prisma.permission.findMany();
  sendResponse({
    res,
    message: 'All permissions',
    data: permissions,
  });
}

async function getPermissionById(req: Request, res: Response) {
  const { permissionId } = req.params;

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  sendResponse({
    res,
    message: 'Permission found',
    data: permission,
  });
}

async function createPermission(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const existingPermission = await prisma.permission.findUnique({
    where: { key: req.body.key },
  });

  if (existingPermission) {
    throw new ConflictError('Permission already exists');
  }

  const permission = await prisma.permission.create({
    data: req.body,
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'PERMISSION',
    resourceId: permission.id,
    metadata: { data: req.body },
  });

  sendResponse({
    res,
    message: 'Permission created',
    data: permission,
    statusCode: 201,
  });
}

async function updatePermission(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    GetByIdPermissionParams,
    unknown,
    UpdatePermissionInput,
    unknown
  >;

  const { permissionId } = request.params;
  const { key, description } = request.body;

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

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'PERMISSION',
    oldData: { key: updatedPermission.key, description: updatedPermission.description },
    newData: { key, description },
    resourceId: updatedPermission.id,
    metadata: { permission: updatedPermission },
  });

  sendResponse({
    res,
    message: 'Permission updated',
    data: updatedPermission,
  });
}

async function deletePermission(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const { permissionId } = req.params;

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  const deletedPermission = await prisma.permission.delete({
    where: { id: permissionId },
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'PERMISSION',
    resourceId: permission.id,
    metadata: { deletedPermission },
  });

  sendResponse({
    res,
    message: 'Permission deleted',
    data: deletedPermission,
  });
}

export {
  createPermission,
  deletePermission,
  getPermissionById,
  getPermissionList,
  listPermissions,
  updatePermission,
};
