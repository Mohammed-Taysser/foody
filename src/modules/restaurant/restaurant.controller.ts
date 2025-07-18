import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import {
  CreateRestaurantInput,
  GetRestaurantByIdParams,
  GetRestaurantListQuery,
  UpdateRestaurantInput,
} from './restaurant.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';

async function getRestaurants(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetRestaurantListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.RestaurantWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  const [data, total] = await Promise.all([
    prisma.restaurant.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
    }),
    prisma.restaurant.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All restaurants',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getRestaurantsList(request: Request, response: Response) {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendSuccessResponse({ response, message: 'Restaurants list', data: restaurants });
}

async function getRestaurantById(request: Request, response: Response) {
  const restaurantId = request.params.restaurantId;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  sendSuccessResponse({ response, message: 'Restaurant found', data: restaurant });
}

async function createRestaurant(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetRestaurantByIdParams,
    unknown,
    CreateRestaurantInput,
    unknown
  >;

  const { body, file: image } = authenticatedRequest;

  const owner = await prisma.user.findUnique({
    where: { id: body.ownerId },
  });

  if (!owner) {
    throw new NotFoundError('Owner not found');
  }

  let imageUrl = undefined;

  if (image) {
    imageUrl = await uploadImage(image, 'restaurant');
  }

  const newRestaurant = await prisma.restaurant.create({
    data: {
      ...body,
      ownerId: owner.id,
      image: imageUrl,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: owner.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'RESTAURANT',
    resourceId: newRestaurant.id,
    metadata: { body },
  });

  sendSuccessResponse({
    response,
    message: 'Restaurant created',
    data: newRestaurant,
    statusCode: 201,
  });
}

async function updateRestaurant(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetRestaurantByIdParams,
    unknown,
    UpdateRestaurantInput,
    unknown
  >;

  const { body, params } = authenticatedRequest;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  if (body.ownerId) {
    const owner = await prisma.user.findUnique({
      where: { id: body.ownerId },
    });

    if (!owner) {
      throw new NotFoundError('Owner not found');
    }
  }

  let imageUrl = restaurant.image;

  if (restaurant.image && request.file) {
    deleteImage(restaurant.image);
  }

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'restaurant');
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: params.restaurantId },
    data: {
      ...body,
      image: imageUrl,
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: restaurant.ownerId,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'RESTAURANT',
    resourceId: restaurant.id,
    oldData: restaurant,
    newData: updatedRestaurant,
    metadata: { body },
  });

  sendSuccessResponse({
    response,
    message: 'Restaurant updated',
    data: updatedRestaurant,
  });
}

async function deleteRestaurant(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;
  const restaurantId = request.params.restaurantId;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  const deletedRestaurant = await prisma.restaurant.delete({
    where: { id: restaurantId },
  });

  if (restaurant.image) {
    deleteImage(restaurant.image);
  }

  databaseLogger.audit({
    requestInfo: getRequestInfo(request),
    actorId: authenticatedRequest.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'RESTAURANT',
    resourceId: restaurant.id,
    metadata: { deletedRestaurant },
  });

  sendSuccessResponse({ response, message: 'Restaurant deleted', data: deletedRestaurant });
}

const restaurantController = {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurants,
  getRestaurantsList,
  updateRestaurant,
};

export default restaurantController;
