import { Request, Response } from 'express';

import type {
  CreateCategoryInput,
  GetByIdCategoryParams,
  UpdateCategoryInput,
} from './category.validator';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import sendResponse from '@/utils/sendResponse';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function createCategory(req: Request, res: Response) {
  const request = req as AuthenticatedRequest<unknown, unknown, CreateCategoryInput>;

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
    imageUrl = await uploadImage(request.file, 'category');
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
  const request = req as unknown as AuthenticatedRequest<
    GetByIdCategoryParams,
    unknown,
    UpdateCategoryInput
  >;

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

  if (category.image && request.file) {
    deleteImage(category.image);
  }

  if (request.file) {
    imageUrl = await uploadImage(request.file, 'category');
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
  const request = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;

  const query = request.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: query.limit,
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
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
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
  const request = req as unknown as AuthenticatedRequest<
    GetByIdCategoryParams,
    unknown,
    unknown,
    unknown
  >;

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
  const request = req as unknown as AuthenticatedRequest<
    GetByIdCategoryParams,
    unknown,
    unknown,
    unknown
  >;

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
