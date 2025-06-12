import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';
import DATABASE_LOGGER from '@/services/database-log.service';

async function addMenuItem(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const user = request.user;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: request.body.restaurantId },
  });

  if (!restaurant) {
    throw new ConflictError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this restaurant');
  }

  const newItem = await prisma.menuItem.create({
    data: request.body,
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'MENU_ITEM',
    resourceId: newItem.id,
    metadata: { data: request.body },
  });

  sendResponse({
    res,
    message: 'Menu item added',
    data: newItem,
  });
}

async function getMenuItems(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const query = request.parsedQuery;

  const page = query.page as number;
  const limit = query.limit as number;
  const skip = (page - 1) * limit;

  const available = query.available as string;

  const where: Prisma.MenuItemWhereInput = {};

  if (query.restaurantId) {
    where.restaurantId = query.restaurantId as string;
  }

  if (available !== undefined) {
    where.available = Boolean(available);
  }

  const [data, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.menuItem.count({ where }),
  ]);

  sendResponse({
    res,
    message: 'Paginated menu items',
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

async function getMenuItemsList(req: Request, res: Response) {
  const data = await prisma.menuItem.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendResponse({ res, message: 'Menu items list', data });
}

async function getMenuItemById(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const itemId = request.params.itemId;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  sendResponse({ res, message: 'Menu item found', data: item });
}

async function updateMenuItem(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const itemId = request.params.itemId;
  const user = request.user;
  const data = request.body;

  if (request.body.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: request.body.restaurantId },
    });

    if (!restaurant) {
      throw new ConflictError('Restaurant not found');
    }
  }

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, restaurantId: request.body.restaurantId },
    include: { restaurant: true },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  if (user.role !== 'ADMIN' && item.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not have permission to update this item');
  }

  const updatedItem = await prisma.menuItem.update({
    where: { id: itemId },
    data,
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'MENU_ITEM',
    resourceId: updatedItem.id,
    metadata: { data },
  });

  sendResponse({ res, message: 'Menu item updated', data: updatedItem });
}

async function deleteMenuItem(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const itemId = request.params.itemId;
  const user = request.user;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { restaurant: true },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  if (user.role !== 'ADMIN' && item.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not have permission to delete this item');
  }

  const deletedMenu = await prisma.menuItem.delete({
    where: { id: itemId },
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'MENU_ITEM',
    resourceId: deletedMenu.id,
    metadata: { data: request.body },
  });

  sendResponse({ res, message: 'Menu item deleted', data: deletedMenu });
}

export {
  addMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  getMenuItemsList,
  updateMenuItem,
};
