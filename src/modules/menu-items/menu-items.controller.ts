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
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { getRequestInfo } from '@/utils/request.utils';

async function getMenuItems(req: Request, response: Response) {
  const authenticatedRequest = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    MenuItemQueryInput
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const where: Prisma.MenuItemWhereInput = {};

  if (query.restaurantId) {
    where.restaurantId = query.restaurantId;
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

  sendPaginatedResponse({
    response,
    message: 'Paginated menu items',

    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getMenuItemsList(request: Request, response: Response) {
  const data = await prisma.menuItem.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendSuccessResponse({ response, message: 'Menu items list', data });
}

async function getMenuItemById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdMenuItemParams,
    unknown,
    unknown,
    unknown
  >;

  const itemId = authenticatedRequest.params.itemId;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  sendSuccessResponse({ response, message: 'Menu item found', data: item });
}

async function createMenuItem(
  request: Request<unknown, unknown, CreateMenuItemInput, unknown>,
  response: Response
) {
  const authenticatedRequest = request as AuthenticatedRequest<
    unknown,
    unknown,
    CreateMenuItemInput,
    unknown
  >;

  const user = authenticatedRequest.user;
  const image = authenticatedRequest.file;
  const data = request.body;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: authenticatedRequest.body.restaurantId },
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
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'MENU_ITEM',
    resourceId: newItem.id,
    metadata: { data: authenticatedRequest.body },
  });

  sendSuccessResponse({
    response,
    message: 'Menu item added',
    data: newItem,
  });
}

async function updateMenuItem(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdMenuItemParams,
    unknown,
    UpdateMenuItemInput,
    unknown
  >;

  const itemId = authenticatedRequest.params.itemId;
  const user = authenticatedRequest.user;
  const data = authenticatedRequest.body;

  if (authenticatedRequest.body.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: authenticatedRequest.body.restaurantId },
    });

    if (!restaurant) {
      throw new ConflictError('Restaurant not found');
    }
  }

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId, restaurantId: authenticatedRequest.body.restaurantId },
    include: { restaurant: true },
  });

  if (!item) throw new NotFoundError('Menu item not found');

  if (user.role !== 'ADMIN' && item.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not have permission to update this item');
  }

  let imageUrl = item.image;

  if (item.image && request.file) {
    deleteImage(item.image);
  }

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'menu');
  }

  const updatedItem = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...data,
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'MENU_ITEM',
    resourceId: updatedItem.id,
    oldData: item,
    newData: updatedItem,
    metadata: { data },
  });

  sendSuccessResponse({ response, message: 'Menu item updated', data: updatedItem });
}

async function deleteMenuItem(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdMenuItemParams,
    unknown,
    unknown,
    unknown
  >;

  const itemId = authenticatedRequest.params.itemId;
  const user = authenticatedRequest.user;

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

  if (item.image && request.file) {
    deleteImage(item.image);
  }

  DATABASE_LOGGER.log({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'MENU_ITEM',
    resourceId: deletedMenu.id,
  });

  sendSuccessResponse({ response, message: 'Menu item deleted', data: deletedMenu });
}

export {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  getMenuItemsList,
  updateMenuItem,
};
