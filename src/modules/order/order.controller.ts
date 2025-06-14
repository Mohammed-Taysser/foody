import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { CreateOrderInput } from './order.validation';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, NotFoundError } from '@/utils/errors.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function getOrders(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;
  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count(),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All orders',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getOrdersList(request: Request, response: Response) {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      invoiceNumber: true,
    },
  });

  const renamed = orders.map(({ id, invoiceNumber }) => ({
    id,
    name: invoiceNumber,
  }));

  sendSuccessResponse({ response, message: 'Orders list', data: renamed });
}

async function getOrderById(request: Request, response: Response) {
  const orderId = request.params.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  sendSuccessResponse({ response, message: 'Order found', data: order });
}

async function createOrder(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest<object, object, CreateOrderInput>;

  const { restaurantId, items, discount } = authenticatedRequest.body;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((i) => i.menuItemId) },
      restaurantId,
    },
  });

  const unExistingItems = items.filter((i) => !menuItems.find((m) => m.id === i.menuItemId));

  if (unExistingItems.length > 0) {
    throw new BadRequestError(
      'Some items not found or not in restaurant ' + JSON.stringify(unExistingItems)
    );
  }

  let total = 0;

  const orderItems: Prisma.OrderItemCreateManyOrderInput[] = items.map((i) => {
    const menuItem = menuItems.find((m) => m.id === i.menuItemId)!;
    total += menuItem.price * i.quantity;
    return {
      menuItemId: i.menuItemId,
      quantity: i.quantity,
    };
  });

  const order = await prisma.order.create({
    data: {
      userId: authenticatedRequest.user.id,
      restaurantId,
      total,
      subtotal: total - discount,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  DATABASE_LOGGER.log({
    action: 'CREATE',
    resource: 'ORDER',
    resourceId: order.id,
    metadata: { data: order },
    request: request,
    actorId: order.userId,
    actorType: 'USER',
  });

  sendSuccessResponse({ response, message: 'Order placed', data: order, statusCode: 201 });
}

async function updateOrder(request: Request, response: Response) {
  const orderId = request.params.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: request.body,
  });

  DATABASE_LOGGER.log({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: request.body },
    request: request,
    actorId: order.userId,
    actorType: 'USER',
    oldData: order,
    newData: updatedOrder,
  });

  sendSuccessResponse({ response, message: 'Order updated', data: updatedOrder });
}

async function updateOrderStatus(request: Request, response: Response) {
  const { status } = request.body;

  const orderId = request.params.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  DATABASE_LOGGER.log({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: { status } },
    request: request,
    actorId: order.userId,
    actorType: 'USER',
    oldData: order,
    newData: updatedOrder,
  });

  sendSuccessResponse({ response, message: 'Order status updated', data: updatedOrder });
}

async function payOrder(request: Request, response: Response) {
  const { orderId } = request.params;
  const { method } = request.body;

  const existOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existOrder) {
    throw new NotFoundError('Order not found');
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentMethod: method,
    },
  });

  DATABASE_LOGGER.log({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: { paymentStatus: 'PAID', paymentMethod: method } },
    request: request,
    actorId: order.userId,
    actorType: 'USER',
    oldData: existOrder,
    newData: order,
  });

  sendSuccessResponse({ response, message: 'Order marked as paid', data: order });
}

async function deleteOrder(request: Request, response: Response) {
  const { orderId } = request.params;
  const user = (request as AuthenticatedRequest).user;

  const existOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existOrder) {
    throw new NotFoundError('Order not found');
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
    },
  });

  DATABASE_LOGGER.log({
    action: 'DELETE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: { status: 'CANCELLED' } },
    request: request,
    actorId: user.id,
    actorType: 'USER',
  });

  sendSuccessResponse({ response, message: 'Order cancelled', data: order });
}

export {
  createOrder,
  deleteOrder,
  getOrders,
  getOrderById,
  getOrdersList,
  payOrder,
  updateOrder,
  updateOrderStatus,
};
