import { Request, Response } from 'express';

import { createRestaurantSchema } from './restaurant.validator';

import sendResponse from '@/utils/sendResponse';

const restaurants: Restaurant[] = []; // 🚧 Replace with DB later

export function createRestaurant(req: Request, res: Response) {
  const data = createRestaurantSchema.parse(req.body);

  const newRestaurant = {
    id: restaurants.length + 1,
    ...data,
  };

  restaurants.push(newRestaurant);

  sendResponse({
    res,
    message: 'Restaurant created',
    data: newRestaurant,
  });
}

export function getRestaurants(_req: Request, res: Response) {
  sendResponse({
    res,
    message: 'All restaurants',
    data: restaurants,
  });
}
