import { Request, Response } from 'express';

import { createMenuItemSchema } from './menu.validator';

import prisma from '@/config/prisma';
import sendResponse from '@/utils/sendResponse';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import { AuthenticatedRequest } from '@/types/import';

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

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.userId) {
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
  const restaurantId = req.params.id;

  const items = await prisma.menuItem.findMany({
    where: { restaurantId },
  });

  sendResponse({
    res,
    message: 'Restaurant menu items',
    data: items,
  });
}

export { addMenuItem, getMenuItems };
