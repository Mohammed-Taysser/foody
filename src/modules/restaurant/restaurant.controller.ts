import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import sendResponse from '@/utils/sendResponse';

async function createRestaurant(req: Request, res: Response) {
  const data = req.body;

  const owner = await prisma.user.findUnique({
    where: { id: data.ownerId },
  });

  if (!owner) {
    throw new Error('Owner not found');
  }

  const newRestaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      ownerId: owner.id,
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
