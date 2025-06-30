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
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { BasePaginationInput } from '@/validations/pagination.validation';
import { getRequestInfo } from '@/utils/request.utils';

async function getCategories(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.count(),
  ]);

  sendPaginatedResponse({
    response,
    message: 'Paginated categories',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getCategoriesList(request: Request, response: Response) {
  const data = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  sendSuccessResponse({ response, message: 'Categories list', data });
}

async function getCategoryById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdCategoryParams,
    unknown,
    unknown,
    unknown
  >;

  const categoryId = authenticatedRequest.params.categoryId;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  sendSuccessResponse({ response, message: 'Category found', data: category });
}

async function createCategory(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest<
    unknown,
    unknown,
    CreateCategoryInput
  >;

  const user = authenticatedRequest.user;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: authenticatedRequest.body.restaurantId },
  });

  if (!restaurant) {
    throw new ConflictError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this restaurant');
  }

  let imageUrl = undefined;

  if (authenticatedRequest.file) {
    imageUrl = await uploadImage(authenticatedRequest.file, 'category');
  }

  const category = await prisma.category.create({
    data: {
      ...authenticatedRequest.body,
      image: imageUrl,
    },
  });

  DATABASE_LOGGER.log({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'CATEGORY',
    resourceId: category.id,
    metadata: { data: authenticatedRequest.body },
  });

  sendSuccessResponse({ response, message: 'Category created', data: category });
}

async function updateCategory(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdCategoryParams,
    unknown,
    UpdateCategoryInput
  >;

  const categoryId = authenticatedRequest.params.categoryId;

  const user = authenticatedRequest.user;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { restaurant: true },
  });

  if (!category) throw new NotFoundError('Category not found');

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: authenticatedRequest.body.restaurantId },
  });

  if (!restaurant) {
    throw new ConflictError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && category.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this category');
  }

  let imageUrl = category.image;

  if (category.image && authenticatedRequest.file) {
    deleteImage(category.image);
  }

  if (authenticatedRequest.file) {
    imageUrl = await uploadImage(authenticatedRequest.file, 'category');
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { ...authenticatedRequest.body, image: imageUrl },
  });

  DATABASE_LOGGER.log({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'CATEGORY',
    resourceId: updated.id,
    oldData: category,
    newData: updated,
    metadata: { data: authenticatedRequest.body },
  });

  sendSuccessResponse({ response, message: 'Category updated', data: updated });
}

async function deleteCategory(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetByIdCategoryParams,
    unknown,
    unknown,
    unknown
  >;

  const categoryId = authenticatedRequest.params.categoryId;

  const user = authenticatedRequest.user;

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
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'CATEGORY',
    resourceId: deletedCategory.id,
  });

  sendSuccessResponse({ response, message: 'Category deleted', data: deletedCategory });
}

export {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoriesList,
  getCategoryById,
  updateCategory,
};
