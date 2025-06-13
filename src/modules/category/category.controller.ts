import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import sendResponse from '@/utils/sendResponse';

async function createCategory(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const user = request.user;

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

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'menu');
  }

  const category = await prisma.category.create({
    data: {
      ...request.body,
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'CATEGORY',
    resourceId: category.id,
    metadata: { data: request.body },
  });

  sendResponse({ res, message: 'Category created', data: category });
}

async function updateCategory(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const categoryId = request.params.categoryId;

  const user = request.user;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { restaurant: true },
  });

  if (!category) throw new NotFoundError('Category not found');

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: request.body.restaurantId },
  });

  if (!restaurant) {
    throw new ConflictError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && category.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this category');
  }

  let imageUrl = category.image;

  if (category.image && req.file) {
    deleteImage(category.image);
  }

  if (req.file) {
    imageUrl = await uploadImage(req.file, 'restaurant');
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { ...request.body, image: imageUrl },
  });

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'CATEGORY',
    resourceId: updated.id,
    oldData: category,
    newData: updated,
    metadata: { data: request.body },
  });

  sendResponse({ res, message: 'Category updated', data: updated });
}

async function listCategories(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const query = request.parsedQuery;

  const page = query.page as number;
  const limit = query.limit as number;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.count(),
  ]);

  sendResponse({
    res,
    message: 'Paginated categories',
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

async function getCategoriesList(req: Request, res: Response) {
  const data = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendResponse({ res, message: 'Categories list', data });
}

async function getCategoryById(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const categoryId = request.params.categoryId;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  sendResponse({ res, message: 'Category found', data: category });
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

  const deletedCategory = await prisma.category.delete({
    where: { id: categoryId },
  });

  if (category.image) {
    deleteImage(category.image);
  }

  DATABASE_LOGGER.log({
    request: request,
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'CATEGORY',
    resourceId: deletedCategory.id,
    metadata: { data: request.body },
  });

  sendResponse({ res, message: 'Category deleted', data: deletedCategory });
}

export {
  createCategory,
  deleteCategory,
  getCategoriesList,
  getCategoryById,
  listCategories,
  updateCategory,
};
