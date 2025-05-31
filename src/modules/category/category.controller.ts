import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function createCategory(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const { id: restaurantId } = request.params;
  const user = request.user;
  const data = request.body;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this restaurant');
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      restaurantId,
    },
  });

  sendResponse({ res, message: 'Category created', data: category });
}

async function updateCategory(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const categoryId = request.params.categoryId;

  const user = request.user;

  const { name } = request.body;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { restaurant: true },
  });

  if (!category) throw new NotFoundError('Category not found');

  if (user.role !== 'ADMIN' && category.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this category');
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { name },
  });

  sendResponse({ res, message: 'Category updated', data: updated });
}

async function listCategories(req: Request, res: Response) {
  const restaurantId = req.params.id;

  const categories = await prisma.category.findMany({
    where: { restaurantId },
    include: {
      items: true,
    },
  });

  sendResponse({ res, message: 'Categories with items', data: categories });
}

async function deleteCategory(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const categoryId = request.params.categoryId;

  const user = request.user;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { restaurant: true },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (user.role !== 'ADMIN' && category.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this category');
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  sendResponse({ res, message: 'Category deleted' });
}

export { createCategory, deleteCategory, listCategories, updateCategory };
