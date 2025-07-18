import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import type {
  CreateCategoryInput,
  GetCategoriesQuery,
  UpdateCategoryInput,
  GetCategoryByIdParams,
} from './category.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/utils/errors.utils';
import { deleteImage, uploadImage } from '@/utils/multer.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';

async function getCategories(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetCategoriesQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.CategoryWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  if (query.restaurantId) {
    filters.restaurantId = {
      equals: query.restaurantId,
    };
  }

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
    }),
    prisma.category.count({
      where: filters,
    }),
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
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetCategoriesQuery
  >;

  const query = authenticatedRequest.query;

  const filters: Prisma.CategoryWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  if (query.restaurantId) {
    filters.restaurantId = {
      equals: query.restaurantId,
    };
  }

  const data = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Categories list', data });
}

async function getCategoryById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetCategoryByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const categoryId = authenticatedRequest.params.categoryId;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
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

  const { user, body, file: image } = authenticatedRequest;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
  });

  if (!restaurant) {
    throw new ConflictError('Restaurant not found');
  }

  if (user.role !== 'ADMIN' && restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this restaurant');
  }

  let imageUrl = undefined;

  if (image) {
    imageUrl = await uploadImage(image, 'category');
  }

  const category = await prisma.category.create({
    data: {
      ...body,
      image: imageUrl,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'CREATE',
    resource: 'CATEGORY',
    resourceId: category.id,
    metadata: { body },
  });

  sendSuccessResponse({ response, message: 'Category created', data: category });
}

async function updateCategory(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetCategoryByIdParams,
    unknown,
    UpdateCategoryInput
  >;

  const { body, params, user, file: image } = authenticatedRequest;

  if (Object.keys(body).length === 0 && !image) {
    throw new BadRequestError('No data provided to update');
  }

  const category = await prisma.category.findUnique({
    where: { id: params.categoryId },
    include: { restaurant: true },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (body.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: body.restaurantId },
    });

    if (!restaurant) {
      throw new ConflictError('Restaurant not found');
    }
  }

  if (user.role !== 'ADMIN' && category.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this category');
  }

  let imageUrl = category.image;

  if (category.image && image) {
    deleteImage(category.image);
  }

  if (image) {
    imageUrl = await uploadImage(image, 'category');
  }

  const updated = await prisma.category.update({
    where: { id: category.id },
    data: { ...body, image: imageUrl },
  });

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'UPDATE',
    resource: 'CATEGORY',
    resourceId: updated.id,
    oldData: category,
    newData: updated,
    metadata: { body },
  });

  sendSuccessResponse({ response, message: 'Category updated', data: updated });
}

async function deleteCategory(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetCategoryByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { user, params } = authenticatedRequest;

  const category = await prisma.category.findUnique({
    where: { id: params.categoryId },
    include: { restaurant: true },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (user.role !== 'ADMIN' && category.restaurant.ownerId !== user.id) {
    throw new ForbiddenError('You do not own this category');
  }

  const deletedCategory = await prisma.category.delete({
    where: { id: category.id },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (category.image) {
    deleteImage(category.image);
  }

  databaseLogger.audit({
    requestInfo: getRequestInfo(authenticatedRequest),
    actorId: user.id,
    actorType: 'USER',
    action: 'DELETE',
    resource: 'CATEGORY',
    resourceId: deletedCategory.id,
  });

  sendSuccessResponse({ response, message: 'Category deleted', data: deletedCategory });
}

const categoryController = {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoriesList,
  getCategoryById,
  updateCategory,
};

export default categoryController;
