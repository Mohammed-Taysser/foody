import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

import {
  CreateMenuItemInput,
  GetMenuItemByIdParams,
  GetMenuItemQuery,
  UpdateMenuItemInput,
} from './menu-items.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';

async function getMenuItems(req: Request, response: Response) {
  const authenticatedRequest = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetMenuItemQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.MenuItemWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  if (query.restaurantId) {
    filters.restaurantId = {
      equals: query.restaurantId,
    };
  }

  if (query.available !== undefined) {
    filters.available = {
      equals: query.available,
    };
  }

  const [data, total] = await Promise.all([
    prisma.menuItem.findMany({
      where: filters,
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.menuItem.count({ where: filters }),
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
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetMenuItemQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const filters: Prisma.MenuItemWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  if (query.restaurantId) {
    filters.restaurantId = {
      equals: query.restaurantId,
    };
  }

  if (query.available !== undefined) {
    filters.available = {
      equals: query.available,
    };
  }

  const data = await prisma.menuItem.findMany({
    select: {
      id: true,
      name: true,
    },
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Menu items list', data });
}

async function getMenuItemById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetMenuItemByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const itemId = authenticatedRequest.params.menuId;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

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

  const { user, body, file: image } = authenticatedRequest;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
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
      ...body,
      price: new Decimal(body.price),
      image: imageUrl,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'MENU_ITEM',
    resourceId: newItem.id,
    metadata: { body },
  });

  sendSuccessResponse({
    response,
    message: 'Menu item added',
    data: newItem,
  });
}

async function updateMenuItem(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetMenuItemByIdParams,
    unknown,
    UpdateMenuItemInput,
    unknown
  >;

  const { body, user, params } = authenticatedRequest;

  const item = await prisma.menuItem.findUnique({
    where: { id: params.menuId },
    include: { restaurant: true },
  });

  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  if (user.role !== 'ADMIN' && item.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not have permission to update this item');
  }

  if (body.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: body.restaurantId },
    });

    if (!restaurant) {
      throw new ConflictError('Restaurant not found');
    }
  }

  let imageUrl = item.image;

  if (item.image && request.file) {
    deleteImage(item.image);
  }

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'menu');
  }

  const updatedItem = await prisma.menuItem.update({
    where: { id: item.id },
    data: {
      ...body,
      price: body.price ? new Decimal(body.price) : item.price,
      image: imageUrl,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'MENU_ITEM',
    resourceId: updatedItem.id,
    oldData: item,
    newData: updatedItem,
    metadata: { body },
  });

  sendSuccessResponse({ response, message: 'Menu item updated', data: updatedItem });
}

async function deleteMenuItem(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetMenuItemByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { user, params } = authenticatedRequest;

  const item = await prisma.menuItem.findUnique({
    where: { id: params.menuId },
    include: { restaurant: true },
  });

  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  if (user.role !== 'ADMIN' && item.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not have permission to delete this item');
  }

  const deletedMenu = await prisma.menuItem.delete({
    where: { id: item.id },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'MENU_ITEM',
    resourceId: deletedMenu.id,
  });

  sendSuccessResponse({ response, message: 'Menu item deleted', data: deletedMenu });
}

const menuItemsController = {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  getMenuItemsList,
  updateMenuItem,
};

export default menuItemsController;
