import { Queue } from 'bullmq';

import { OrderJobNames } from './order';

import redis from '@/config/redis';

const orderQueue = new Queue<unknown, unknown, OrderJobNames, unknown, unknown, string>(
  'order-queue',
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false, // keep failed jobs for inspection
    },
  }
);

export default orderQueue;
