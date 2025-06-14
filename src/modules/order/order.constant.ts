import { OrderStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export { VALID_TRANSITIONS };
