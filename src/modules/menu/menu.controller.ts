import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { createMenuItemSchema } from './menu.validator';

import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { ForbiddenError, NotFoundError } from '@/utils/errors';
import sendResponse from '@/utils/sendResponse';

async function addMenuItem(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const restaurantId = request.params.id;
  const user = request.user;
  const data = createMenuItemSchema.parse(request.body);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this restaurant');
  }

  const newItem = await prisma.menuItem.create({
    data: {
      ...data,
      restaurantId,
    },
  });

  sendResponse({
    res,
    message: 'Menu item added',
    data: newItem,
  });
}

async function getMenuItems(req: Request, res: Response) {
  const { id: restaurantId } = req.params;
  const { page = '1', limit = '10', available } = req.query;

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const where: Prisma.MenuItemWhereInput = { restaurantId };

  if (available !== undefined) {
    where.available = available === 'true';
  }

  const items = await prisma.menuItem.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.menuItem.count({ where });

  sendResponse({
    res,
    message: 'Paginated menu items',
    data: {
      data: items,
      metadata: {
        total,
        page: Number(page),
        limit: take,
      },
    },
  });
}

async function updateMenuItem(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const itemId = request.params.itemId;
  const restaurantId = request.params.id;
  const user = request.user;
  const data = request.body;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, restaurantId },
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

  sendResponse({ res, message: 'Menu item updated', data: updatedItem });
}

async function deleteMenuItem(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const itemId = request.params.itemId;
  const restaurantId = request.params.id;
  const user = request.user;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, restaurantId },
    include: { restaurant: true },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  if (user.role !== 'ADMIN' && item.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not have permission to delete this item');
  }

  await prisma.menuItem.delete({
    where: { id: itemId },
  });

  sendResponse({ res, message: 'Menu item deleted' });
}

export { addMenuItem, deleteMenuItem, getMenuItems, updateMenuItem };
