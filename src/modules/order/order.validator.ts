import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { z } from 'zod';

import { zodParseEnumList } from '@/utils/zod-utils';
import basePaginationSchema from '@/validations/base.validation';

const getOrdersListSchema = {
  query: basePaginationSchema.extend({
    status: zodParseEnumList<OrderStatus>([
      'PENDING',
      'PREPARING',
      'COMPLETED',
      'CANCELLED',
    ]).optional(),
    userId: z.string().trim().max(100).optional(),
    restaurantId: z.string().trim().max(100).optional(),
    paymentStatus: zodParseEnumList<PaymentStatus>(['REFUNDED', 'PAID', 'UNPAID']).optional(),
    paymentMethod: zodParseEnumList<PaymentMethod>(['CASH', 'CARD', 'ONLINE']).optional(),
    tableNumber: z.coerce.number().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  }),
};

const createOrderSchema = {
  body: z.object({
    restaurantId: z.string().trim().max(100),
    items: z
      .array(
        z.object({
          menuItemId: z.string().trim().max(100),
          quantity: z.number().min(1),
          notes: z.string().trim().max(200).optional().default(''),
        })
      )
      .min(1),
    tableNumber: z.number().optional(),
    notes: z.string().trim().optional().default(''),
    discount: z.number().min(0).default(0),
  }),
};

const updateOrderSchema = {
  body: z.object({
    restaurantId: z.string().trim().max(100).optional(),
    items: z
      .array(
        z.object({
          id: z.string().trim().optional(),
          menuItemId: z.string().trim().max(100),
          notes: z.string().trim().max(200).optional().default(''),
          quantity: z.number().min(1),
        })
      )
      .optional()
      .default([]),
    tableNumber: z.number().optional(),
    notes: z.string().trim().optional(),
    discount: z.number().min(0).default(0),
  }),
  params: z.object({
    orderId: z.string().trim().max(100),
  }),
};

const updateOrderStatusSchema = {
  body: z.object({
    status: z.enum(['PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED']),
  }),
  params: z.object({
    orderId: z.string().trim().max(100),
  }),
};

const payOrderSchema = {
  body: z.object({
    paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE']),
  }),
  params: z.object({
    orderId: z.string().trim().max(100),
  }),
};

const getOrderByIdSchema = {
  params: z.object({
    orderId: z.string().trim().max(100),
  }),
};

type CreateOrderInput = z.infer<typeof createOrderSchema.body>;
type UpdateOrderInput = z.infer<typeof updateOrderSchema.body>;
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema.body>;
type PayOrderInput = z.infer<typeof payOrderSchema.body>;
type GetOrdersListQuery = z.infer<typeof getOrdersListSchema.query>;
type GetOrderByIdParams = z.infer<typeof getOrderByIdSchema.params>;

const orderValidator = {
  createOrderSchema,
  payOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  getOrdersListSchema,
  getOrderByIdSchema,
};

export default orderValidator;
export type {
  CreateOrderInput,
  GetOrderByIdParams,
  GetOrdersListQuery,
  PayOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
};
