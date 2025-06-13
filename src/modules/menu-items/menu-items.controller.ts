import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import {
  CreateMenuItemInput,
  GetByIdMenuItemParams,
  MenuItemQueryInput,
  UpdateMenuItemInput,
} from './menu-items.validator';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import sendResponse from '@/utils/sendResponse';

async function addMenuItem(
  req: Request<unknown, unknown, CreateMenuItemInput, unknown>,
  res: Response
) {
  const request = req as AuthenticatedRequest<unknown, unknown, CreateMenuItemInput, unknown>;

  const user = request.user;
  const image = request.file;
  const data = req.body;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: request.body.restaurantId },
  });

  if (!restaurant) {
    throw new ConflictError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this restaurant');
  }

  let imageUrl = undefined;

  if (image) {
    imageUrl = await uploadImage(image, 'menu');
  }

  const newItem = await prisma.menuItem.create({
    data: {
      ...data,
      image: imageUrl,
    },
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
  const request = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    MenuItemQueryInput
  >;

  const query = request.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const where: Prisma.MenuItemWhereInput = {};

  if (query.restaurantId) {
    where.restaurantId = query.restaurantId as string;
  }

  if (query.available !== undefined) {
    where.available = query.available;
  }

  const [data, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take: query.limit,
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
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
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
  const request = req as unknown as AuthenticatedRequest<
    GetByIdMenuItemParams,
    unknown,
    unknown,
    unknown
  >;

  const itemId = request.params.itemId;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  sendResponse({ res, message: 'Menu item found', data: item });
}

async function updateMenuItem(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    GetByIdMenuItemParams,
    unknown,
    UpdateMenuItemInput,
    unknown
  >;

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

  let imageUrl = item.image;

  if (item.image && req.file) {
    deleteImage(item.image);
  }

  if (req.file) {
    imageUrl = await uploadImage(req.file, 'menu');
  }

  const updatedItem = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...data,
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'MENU_ITEM',
    resourceId: updatedItem.id,
    oldData: item,
    newData: updatedItem,
    metadata: { data },
  });

  sendResponse({ res, message: 'Menu item updated', data: updatedItem });
}

async function deleteMenuItem(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    GetByIdMenuItemParams,
    unknown,
    unknown,
    unknown
  >;

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

  if (item.image && req.file) {
    deleteImage(item.image);
  }

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'MENU_ITEM',
    resourceId: deletedMenu.id,
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
