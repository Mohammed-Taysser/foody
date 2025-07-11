import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { VALID_TRANSITIONS } from './order.constant';
import { CreateOrderInput, UpdateOrderInput } from './order.validation';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { getRequestInfo } from '@/utils/request.utils';
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
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    unknown
  >;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (authenticatedRequest.user.role !== 'ADMIN' && order.userId !== authenticatedRequest.user.id) {
    throw new ForbiddenError('Not your order');
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

  databaseLogger.audit({
    action: 'CREATE',
    resource: 'ORDER',
    resourceId: order.id,
    metadata: { data: order },
    requestInfo: getRequestInfo(request),
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

  databaseLogger.audit({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: request.body },
    requestInfo: getRequestInfo(request),
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

  // Final state check
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
    throw new BadRequestError('Cannot update a finalized order');
  }

  const allowedTransitions = VALID_TRANSITIONS[order.status];

  if (!allowedTransitions.includes(status)) {
    throw new BadRequestError(`Invalid status transition from ${order.status} to ${status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  databaseLogger.audit({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: { status } },
    requestInfo: getRequestInfo(request),
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

  if (existOrder.paymentStatus === 'PAID') {
    throw new BadRequestError('Order is already paid');
  }

  if (!['PENDING', 'PREPARING'].includes(existOrder.status)) {
    throw new BadRequestError('Cannot pay for this order anymore');
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentMethod: method,
    },
  });

  databaseLogger.audit({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: { paymentStatus: 'PAID', paymentMethod: method } },
    requestInfo: getRequestInfo(request),
    actorId: order.userId,
    actorType: 'USER',
    oldData: existOrder,
    newData: order,
  });
  sendSuccessResponse({ response, message: 'Order marked as paid', data: order });
}

async function cancelOrder(request: Request, response: Response) {
  const { orderId } = request.params;

  const authenticatedRequest = request as AuthenticatedRequest<unknown, unknown, UpdateOrderInput>;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.userId !== authenticatedRequest.user.id) {
    throw new ForbiddenError('Not your order');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestError('Cannot cancel at this stage');
  }

  const cancelled = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  });

  sendSuccessResponse({ response, message: 'Order cancelled', data: cancelled });
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

  const order = await prisma.order.delete({
    where: { id: orderId },
  });

  databaseLogger.audit({
    action: 'DELETE',
    resource: 'ORDER',
    resourceId: orderId,
    requestInfo: getRequestInfo(request),
    actorId: user.id,
    actorType: 'USER',
  });

  sendSuccessResponse({ response, message: 'Order deleted', data: order });
}

export {
  cancelOrder,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  getOrdersList,
  payOrder,
  updateOrder,
  updateOrderStatus,
};
