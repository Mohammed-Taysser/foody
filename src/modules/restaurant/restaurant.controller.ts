import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import sendResponse from '@/utils/sendResponse';

async function createRestaurant(req: Request, res: Response) {
  const data = req.body;
  const image = req.file;

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

  DATABASE_LOGGER.log({
    request: req,
    actorId: owner.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'RESTAURANT',
    resourceId: newRestaurant.id,
  });

  sendResponse({
    res,
    message: 'Restaurant created',
    data: newRestaurant,
    statusCode: 201,
  });
}

async function getRestaurants(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;
  const query = request.parsedQuery;

  const page = query.page as number;
  const limit = query.limit as number;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.restaurant.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.restaurant.count(),
  ]);

  sendResponse({
    res,
    message: 'All restaurants',
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

async function getRestaurantsList(req: Request, res: Response) {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  sendResponse({ res, message: 'Restaurants list', data: restaurants });
}

const getRestaurantById = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  sendResponse({ res, message: 'Restaurant found', data: restaurant });
};

const updateRestaurant = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  const data = req.body;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  let imageUrl = restaurant.image;

  if (restaurant.image && req.file) {
    deleteImage(restaurant.image);
  }

  if (req.file) {
    imageUrl = await uploadImage(req.file, 'restaurant');
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...data,
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    request: req,
    actorId: restaurant.ownerId,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'RESTAURANT',
    resourceId: restaurant.id,
    oldData: restaurant,
    newData: updatedRestaurant,
    metadata: { data },
  });

  sendResponse({
    res,
    message: 'Restaurant updated',
    data: updatedRestaurant,
  });
};

const deleteRestaurant = async (req: Request, res: Response) => {
  const request = req as AuthenticatedRequest;
  const restaurantId = req.params.restaurantId;

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

  DATABASE_LOGGER.log({
    request: req,
    actorId: request.user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'RESTAURANT',
    resourceId: restaurant.id,
    metadata: { deletedRestaurant },
  });

  sendResponse({ res, message: 'Restaurant deleted', data: deletedRestaurant });
};

export {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurants,
  getRestaurantsList,
  updateRestaurant,
};
