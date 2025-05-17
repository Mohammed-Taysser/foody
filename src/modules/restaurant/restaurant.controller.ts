import { Request, Response } from 'express';

import { createRestaurantSchema } from './restaurant.validator';

import sendResponse from '@/utils/sendResponse';
import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';

async function createRestaurant(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const data = createRestaurantSchema.parse(req.body);

  const newRestaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      ownerId: request.user.userId,
    },
  });

  sendResponse({
    res,
    message: 'Restaurant created',
    data: newRestaurant,
  });
}

async function getRestaurants(_req: Request, res: Response) {
  const restaurants = await prisma.restaurant.findMany();

  sendResponse({
    res,
    message: 'All restaurants',
    data: restaurants,
  });
}

export { createRestaurant, getRestaurants };
