import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function listPermissionGroups(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const query = request.parsedQuery;

  const page = query.page as number;
  const limit = query.limit as number;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.permissionGroup.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.permissionGroup.count(),
  ]);

  sendResponse({
    res,
    message: 'Paginated permission groups',
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

async function getPermissionGroupList(req: Request, res: Response) {
  const permissions = await prisma.permissionGroup.findMany();
  sendResponse({
    res,
    message: 'All permissions groups',
    data: permissions,
  });
}

async function getPermissionGroupById(req: Request, res: Response) {
  const { permissionGroupId } = req.params;

  const permission = await prisma.permissionGroup.findUnique({
    where: { id: permissionGroupId },
  });

  if (!permission) {
    throw new NotFoundError('Permission group not found');
  }

  sendResponse({
    res,
    message: 'Permission group found',
    data: permission,
  });
}

async function createPermissionGroup(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const existingGroup = await prisma.permissionGroup.findUnique({
    where: { name: req.body.name },
  });

  if (existingGroup) {
    throw new Error('Permission group already exists');
  }

  const permission = await prisma.permissionGroup.create({
    data: req.body,
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'PERMISSION_GROUP',
    resourceId: permission.id,
    metadata: { data: req.body },
  });

  sendResponse({
    res,
    message: 'Permission group created',
    data: permission,
    statusCode: 201,
  });
}

async function updatePermissionGroup(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const { permissionGroupId } = req.params;
  const { name, description } = req.body;

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

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'PERMISSION_GROUP',
    oldData: { name: updatedPermission.name, description: updatedPermission.description },
    newData: { name, description },
    resourceId: updatedPermission.id,
    metadata: { permission: updatedPermission },
  });

  sendResponse({
    res,
    message: 'Permission group updated',
    data: updatedPermission,
  });
}

async function deletePermissionGroup(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const { permissionGroupId } = req.params;

  const permission = await prisma.permissionGroup.findUnique({
    where: { id: permissionGroupId },
  });

  if (!permission) {
    throw new NotFoundError('Permission group not found');
  }

  const deletedGroupPermission = await prisma.permissionGroup.delete({
    where: { id: permissionGroupId },
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'PERMISSION_GROUP',
    resourceId: permission.id,
    metadata: { deletedGroupPermission },
  });

  sendResponse({
    res,
    message: 'Permission group deleted',
    data: deletedGroupPermission,
  });
}

export {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroupById,
  getPermissionGroupList,
  listPermissionGroups,
  updatePermissionGroup,
};
