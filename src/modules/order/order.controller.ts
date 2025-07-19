import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { VALID_TRANSITIONS } from './order.constant';
import {
  CreateOrderInput,
  GetOrderByIdParams,
  GetOrdersListQuery,
  PayOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from './order.validator';

import prisma from '@/apps/prisma';
import databaseLogger from '@/services/database-log.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { getRequestInfo } from '@/utils/request.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/send-response';
import { buildDateRangeFilter } from '@/utils/dayjs.utils';

async function getOrders(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetOrdersListQuery
  >;
  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.OrderWhereInput = {};

  if (query.restaurantId) {
    filters.restaurantId = {
      equals: query.restaurantId,
    };
  }

  if (query.userId) {
    filters.userId = {
      equals: query.userId,
    };
  }

  if (query.status?.length) {
    filters.status = {
      in: query.status,
    };
  }

  if (query.paymentStatus?.length) {
    filters.paymentStatus = {
      in: query.paymentStatus,
    };
  }

  if (query.paymentMethod?.length) {
    filters.paymentMethod = {
      in: query.paymentMethod,
    };
  }

  if (query.createdAt) {
    filters.createdAt = buildDateRangeFilter(query.createdAt);
  }

  if (query.tableNumber) {
    filters.tableNumber = {
      equals: query.tableNumber,
    };
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: filters,
    }),
    prisma.order.count({
      where: filters,
    }),
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
    },
  });

  const renamed = orders.map(({ id }) => ({
    id,
    name: id,
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
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
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

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new BadRequestError('Restaurant not found');
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((i) => i.menuItemId) },
      restaurantId,
    },
  });

  const unExistingItems = items.filter((i) => !menuItems.find((m) => m.id === i.menuItemId));

  if (unExistingItems.length > 0) {
    throw new BadRequestError(
      'Some items not found or not in restaurant ' +
        unExistingItems.map((i) => i.menuItemId).join(', ')
    );
  }

  let total: Prisma.Decimal = new Prisma.Decimal(0);

  const orderItems: Prisma.OrderItemCreateManyOrderInput[] = items.map((i) => {
    const menuItem = menuItems.find((m) => m.id === i.menuItemId)!;
    const itemTotal = new Prisma.Decimal(menuItem.price).mul(i.quantity);
    total = total.plus(itemTotal);

    return {
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      notes: i.notes,
    };
  });

  const subtotal = total.minus(new Prisma.Decimal(discount));

  const order = await prisma.order.create({
    data: {
      ...authenticatedRequest.body,
      userId: authenticatedRequest.user.id,
      total,
      subtotal,
      items: { create: orderItems },
    },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
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
  const authenticatedRequest = request as AuthenticatedRequest<
    GetOrderByIdParams,
    object,
    UpdateOrderInput
  >;

  const { params, body, user } = authenticatedRequest;

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (user.role !== 'ADMIN' && order.userId !== user.id) {
    throw new ForbiddenError('Not your order');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestError('Only orders in PENDING status can be updated');
  }

  if (body.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: body.restaurantId },
    });

    if (!restaurant) {
      throw new BadRequestError('Restaurant not found');
    }
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: body.items.map((i) => i.menuItemId) },
      restaurantId: body.restaurantId,
    },
  });

  const unExistingMenuItems = body.items.filter(
    (item) => !menuItems.some((menuItem) => menuItem.id === item.menuItemId)
  );
  if (unExistingMenuItems.length > 0) {
    throw new BadRequestError(
      'Some menu items not found or not in restaurant: ' +
        unExistingMenuItems.map((i) => i.menuItemId).join(', ')
    );
  }

  const existingOrderItems = await prisma.orderItem.findMany({
    where: { orderId: params.orderId },
  });

  const unExistingOrderItems = body.items
    .filter((item) => item.id) // only check items that claim to exist
    .filter((item) => !existingOrderItems.some((orderItem) => orderItem.id === item.id));

  if (unExistingOrderItems.length > 0) {
    throw new BadRequestError(
      'Some order items not found or not in order: ' +
        unExistingOrderItems.map((i) => i.id).join(', ')
    );
  }

  const itemsToCreate = body.items.filter((item) => !item.id);
  const itemToUpdate = body.items.filter((item) => item.id);
  const incomingItemsIds = itemToUpdate.map((item) => item.id);
  const itemsToDelete = existingOrderItems.filter((item) => !incomingItemsIds.includes(item.id));

  let total: Prisma.Decimal = new Prisma.Decimal(0);

  body.items.forEach((item) => {
    const menuItem = menuItems.find((menuItem) => menuItem.id === item.menuItemId)!;
    total = total.plus(new Prisma.Decimal(menuItem.price).mul(item.quantity));
  });

  const subtotal = total.minus(new Prisma.Decimal(body.discount));

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      ...body,
      total,
      subtotal,
      items: {
        update: itemToUpdate.map((item) => ({
          where: { id: item.id },
          data: {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          },
        })),
        deleteMany: {
          id: { in: itemsToDelete.map((item) => item.id) },
        },
        create: itemsToCreate.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      },
    },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  databaseLogger.audit({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: order.id,
    metadata: { body },
    requestInfo: getRequestInfo(request),
    actorId: order.userId,
    actorType: 'USER',
    oldData: order,
    newData: updatedOrder,
  });

  sendSuccessResponse({
    response,
    message: 'Order updated',
    data: updatedOrder,
  });
}

async function updateOrderStatus(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest<
    GetOrderByIdParams,
    object,
    UpdateOrderStatusInput
  >;

  const { status } = authenticatedRequest.body;

  const orderId = authenticatedRequest.params.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (authenticatedRequest.user.role !== 'ADMIN' && order.userId !== authenticatedRequest.user.id) {
    throw new ForbiddenError('Not your order');
  }

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
    include: {
      items: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
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
  const authenticatedRequest = request as AuthenticatedRequest<
    GetOrderByIdParams,
    object,
    PayOrderInput
  >;

  const { orderId } = authenticatedRequest.params;
  const { paymentMethod } = authenticatedRequest.body;

  const existOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existOrder) {
    throw new NotFoundError('Order not found');
  }

  if (existOrder.userId !== authenticatedRequest.user.id) {
    throw new ForbiddenError('Not your order');
  }

  if (existOrder.paymentStatus === 'PAID') {
    throw new BadRequestError('Order is already paid');
  }

  if (existOrder.paymentStatus === 'REFUNDED') {
    throw new BadRequestError('Order is already refunded');
  }

  if (!['PENDING', 'PREPARING'].includes(existOrder.status)) {
    throw new BadRequestError('Cannot pay for this order anymore');
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentMethod,
    },
    include: {
      items: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  databaseLogger.audit({
    action: 'UPDATE',
    resource: 'ORDER',
    resourceId: orderId,
    metadata: { data: { paymentStatus: 'PAID', paymentMethod } },
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

  if (order.status === 'CANCELLED') {
    throw new BadRequestError('Order already cancelled');
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
    include: {
      items: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
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
    include: {
      items: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
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

const orderController = {
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

export default orderController;
