import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { CreateOrderInput } from './order.validation';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, NotFoundError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';
import { BasePaginationInput } from '@/validations/pagination.validation';

async function getAllOrders(req: Request, res: Response) {
  const request = req as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    BasePaginationInput
  >;
  const query = request.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count(),
  ]);

  sendResponse({
    res,
    message: 'All orders',
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

async function getOrdersList(req: Request, res: Response) {
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

  sendResponse({ res, message: 'Orders list', data: renamed });
}

async function getOrderById(req: Request, res: Response) {
  const orderId = req.params.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  sendResponse({ res, message: 'Order found', data: order });
}

async function updateOrder(req: Request, res: Response) {
  const orderId = req.params.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: req.body,
  });

  DATABASE_LOGGER.log({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: req.body },
    request: req,
    actorId: order.userId,
    actorType: 'USER',
    oldData: order,
    newData: updatedOrder,
  });

  sendResponse({ res, message: 'Order updated', data: updatedOrder });
}

async function updateOrderStatus(req: Request, res: Response) {
  const { status } = req.body;

  const orderId = req.params.orderId;

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
    request: req,
    actorId: order.userId,
    actorType: 'USER',
    oldData: order,
    newData: updatedOrder,
  });

  sendResponse({ res, message: 'Order status updated', data: updatedOrder });
}

async function createOrder(req: Request, res: Response) {
  const request = req as AuthenticatedRequest<object, object, CreateOrderInput>;

  const { restaurantId, items, discount } = request.body;

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
      userId: request.user.id,
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
    request: req,
    actorId: order.userId,
    actorType: 'USER',
  });

  sendResponse({ res, message: 'Order placed', data: order, statusCode: 201 });
}

async function payOrder(req: Request, res: Response) {
  const { orderId } = req.params;
  const { method } = req.body;

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
    request: req,
    actorId: order.userId,
    actorType: 'USER',
    oldData: existOrder,
    newData: order,
  });

  sendResponse({ res, message: 'Order marked as paid', data: order });
}

async function deleteOrder(req: Request, res: Response) {
  const { orderId } = req.params;
  const user = (req as AuthenticatedRequest).user;

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
    request: req,
    actorId: user.id,
    actorType: 'USER',
  });

  sendResponse({ res, message: 'Order cancelled', data: order });
}

export {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrdersList,
  payOrder,
  updateOrder,
  updateOrderStatus,
};
