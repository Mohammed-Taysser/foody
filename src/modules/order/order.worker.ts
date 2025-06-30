import { Worker } from 'bullmq';

import { OrderJobNames, OrderJobPayloads } from './order';

import redis from '@/config/redis';
import DATABASE_LOGGER from '@/services/database-log.service';
import { socketIO } from '@/services/socket.io';
import WINSTON_LOGGER from '@/services/winston-log.service';
import prisma from '@/config/prisma';
import { getRequestInfo } from '@/utils/request.utils';

const handlers = {
  'add:order': async (job: OrderJobPayloads['add:order']) => {
    const { request, order } = job.data;

    socketIO.to(`restaurant:${order.restaurantId}`).emit('add:order', order);

    await DATABASE_LOGGER.log({
      action: 'CREATE',
      resource: 'ORDER',
      resourceId: order.id,
      metadata: { data: order },
      actorId: order.userId,
      actorType: 'USER',
      requestInfo: getRequestInfo(request),
    });
  },
  'update-status:order': async (job: OrderJobPayloads['update-status:order']) => {
    const { request, order } = job.data;

    socketIO.to(`restaurant:${order.restaurantId}`).emit('update-status:order', {
      orderId: order.id,
      status: order.status,
    });

    DATABASE_LOGGER.log({
      action: 'UPDATE',
      resource: 'ORDER',
      resourceId: order.id,
      requestInfo: getRequestInfo(request),
      actorId: order.userId,
      actorType: 'USER',
      oldData: order,
      newData: order,
    });
  },
  'pay:order': async (job: OrderJobPayloads['pay:order']) => {
    const { request, order, oldOrder } = job.data;

    DATABASE_LOGGER.log({
      action: 'UPDATE',
      resource: 'ORDER',
      resourceId: order.id,
      metadata: { data: { paymentStatus: 'PAID', paymentMethod: order.paymentMethod } },
      requestInfo: getRequestInfo(request),
      actorId: order.userId,
      actorType: 'USER',
      oldData: oldOrder,
      newData: order,
    });
  },
  'delete:order': async (job: OrderJobPayloads['delete:order']) => {
    const { request, order } = job.data;

    DATABASE_LOGGER.log({
      action: 'DELETE',
      resource: 'ORDER',
      resourceId: order.id,
      requestInfo: getRequestInfo(request),
      actorId: order.userId,
      actorType: 'USER',
    });
  },
};

const orderWorker = new Worker(
  'orderQueue',
  async (job) => {
    const handler = handlers[job.name as OrderJobNames];

    if (!handler) {
      throw new Error(`No handler found for job type: ${job.name}`);
    }

    await handler(job);
  },
  {
    connection: redis,
    concurrency: 3,
    lockDuration: 30000,
    autorun: true,
  }
);

orderWorker.on('completed', async (job, result) => {
  WINSTON_LOGGER.info(`✅ Completed: ${job.name} (${job.id})`);

  await prisma.jobLog.create({
    data: {
      jobId: job.id as string,
      jobName: job.name,
      status: 'COMPLETED',
      data: job.data,
      result,
    },
  });
});

orderWorker.on('failed', async (job, err) => {
  WINSTON_LOGGER.error(`❌ Failed: ${job?.name} (${job?.id}): ${err.message}`);

  await prisma.jobLog.create({
    data: {
      jobId: job?.id as string,
      jobName: job?.name as string,
      status: 'FAILED',
      data: job?.data ?? {},
      error: err.message,
    },
  });
});

export default orderWorker;
