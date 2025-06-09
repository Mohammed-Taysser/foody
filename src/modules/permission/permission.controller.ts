import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function listPermissions(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const query = request.parsedQuery;

  const page = query.page as number;
  const limit = query.limit as number;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.permission.findMany({
      skip,
      take: limit,
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
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
  const existingPermission = await prisma.permission.findUnique({
    where: { key: req.body.key },
  });

  if (existingPermission) {
    throw new ConflictError('Permission already exists');
  }

  const permission = await prisma.permission.create({
    data: req.body,
  });

  sendResponse({
    res,
    message: 'Permission created',
    data: permission,
    statusCode: 201,
  });
}

async function updatePermission(req: Request, res: Response) {
  const { permissionId } = req.params;
  const { key, description } = req.body;

  const permission = await prisma.permission.update({
    where: { id: permissionId },
    data: { key, description },
  });

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  sendResponse({
    res,
    message: 'Permission updated',
    data: permission,
  });
}

async function deletePermission(req: Request, res: Response) {
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
