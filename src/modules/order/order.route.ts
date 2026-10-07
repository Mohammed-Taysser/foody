import { Router } from 'express';

import controller from './order.controller';
import validator from './order.validator';

import authenticate from '@/middleware/authenticate.middleware';
import requirePermission from '@/middleware/require-permission.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  validateRequest(validator.getOrdersListSchema),
  requirePermission(['view:order']),
  controller.getOrders
);

router.get(
  '/export',
  authenticate,
  validateRequest(validator.exportOrdersSchema),
  requirePermission(['export:order']),
  controller.exportOrders
);

router.post(
  '/',
  authenticate,
  requirePermission(['add:order']),
  validateRequest(validator.createOrderSchema),
  controller.createOrder
);

router.get('/list', authenticate, requirePermission(['view:order']), controller.getOrdersList);

router.get(
  '/:orderId',
  authenticate,
  requirePermission(['view:order']),
  validateRequest(validator.getOrderByIdSchema),
  controller.getOrderById
);

router.delete(
  '/:orderId',
  authenticate,
  requirePermission(['delete:order']),
  validateRequest(validator.getOrderByIdSchema),
  controller.deleteOrder
);

router.patch(
  '/:orderId',
  authenticate,
  requirePermission(['update:order']),
  validateRequest(validator.updateOrderSchema),
  controller.updateOrder
);

router.patch(
  '/:orderId/update-order-status',
  authenticate,
  requirePermission(['update:order']),
  validateRequest(validator.updateOrderStatusSchema),
  controller.updateOrderStatus
);

router.patch(
  '/:orderId/pay-order',
  authenticate,
  requirePermission(['update:order']),
  validateRequest(validator.payOrderSchema),
  controller.payOrder
);

router.patch(
  '/:orderId/cancel-order',
  authenticate,
  requirePermission(['update:order']),
  validateRequest(validator.getOrderByIdSchema),
  controller.cancelOrder
);

export default router;
