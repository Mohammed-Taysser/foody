import { Order } from '@prisma/client';
import { Job } from 'bullmq';
import { Request } from 'express';

type OrderJobNames = keyof OrderJobPayloads;

interface OrderJobPayloads {
  'add:order': Job<{
    request: Request;
    order: Order;
  }>;
  'update-status:order': Job<{
    request: Request;
    order: Order;
  }>;
  'pay:order': Job<{
    request: Request;
    order: Order;
    oldOrder: Order;
  }>;
  'delete:order': Job<{
    request: Request;
    order: Order;
  }>;
}

export { OrderJobNames, OrderJobPayloads };
