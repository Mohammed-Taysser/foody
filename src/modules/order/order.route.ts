import { Router } from 'express';

import {
  cancelOrder,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  getOrdersList,
  payOrder,
  updateOrder,
  updateOrderStatus,
} from './order.controller';
import {
  createOrderSchema,
  payOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
} from './order.validation';

import authenticate from '@/middleware/authenticate.middleware';
import authorize from '@/middleware/authorize.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import ZodValidate from '@/middleware/zod-validate.middleware';
import basePaginationSchema from '@/validations/pagination.validation';

const router = Router();

router.get(
  '/',
  authenticate,
  ZodValidate(basePaginationSchema, 'query'),
  requirePermission(['view:order']),
  getOrders
);

router.post(
  '/',
  authenticate,
  requirePermission(['add:order']),
  ZodValidate(createOrderSchema),
  createOrder
);

router.get('/list', authenticate, requirePermission(['view:order']), getOrdersList);

router.get('/:orderId', authenticate, requirePermission(['view:order']), getOrderById);

router.delete('/:orderId', authenticate, requirePermission(['delete:order']), deleteOrder);

router.patch(
  '/:orderId',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['update:order']),
  ZodValidate(updateOrderSchema),
  updateOrder
);

router.patch(
  '/:orderId/update-order-status',
  authenticate,
  requirePermission(['update:order']),
  ZodValidate(updateOrderStatusSchema),
  updateOrderStatus
);

router.patch(
  '/:orderId/pay-order',
  authenticate,
  requirePermission(['update:order']),
  ZodValidate(payOrderSchema),
  payOrder
);

router.patch(
  '/:orderId/cancel-order',
  authenticate,
  requirePermission(['update:order']),
  cancelOrder
);

export default router;
