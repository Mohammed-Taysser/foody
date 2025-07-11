import { Request, Response } from 'express';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function getRestaurants(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.restaurant.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.restaurant.count(),
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
  const data = request.body;
  const image = request.file;

  if (!data.ownerId) {
    throw new BadRequestError('Owner id is required');
  }

  const owner = await prisma.user.findUnique({
    where: { id: data.ownerId },
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
      name: data.name,
      description: data.description,
      location: data.location,
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
    metadata: { data },
  });

  sendSuccessResponse({
    response,
    message: 'Restaurant created',
    data: newRestaurant,
    statusCode: 201,
  });
}

async function updateRestaurant(request: Request, response: Response) {
  const restaurantId = request.params.restaurantId;
  const data = request.body;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  let imageUrl = restaurant.image;

  if (restaurant.image && request.file) {
    deleteImage(restaurant.image);
  }

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'restaurant');
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...data,
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
    metadata: { data },
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

export {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurants,
  getRestaurantsList,
  updateRestaurant,
};
