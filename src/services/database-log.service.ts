import { Prisma } from '@prisma/client';

import prisma from '@/apps/prisma';
import { formatDeepDiff } from '@/utils/deep-diff.utils';
import { AuditLogParams } from '@/types/import';
import CONFIG from '@/apps/config';
import logger from '@/utils/logger.utils';

class DatabaseLogger {
  prepareDifference(
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>
  ): Prisma.InputJsonObject {
    if (oldData && newData) {
      return formatDeepDiff(oldData, newData) as Prisma.InputJsonObject;
    }

    return {};
  }

  async audit(params: AuditLogParams) {
    const diff = this.prepareDifference(params.oldData, params.newData);

    const log = await prisma.auditLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        diff: diff,
        metadata: {
          ...params.requestInfo,
          ...params.metadata,
        },
      },
    });

    if (CONFIG.NODE_ENV !== 'test') {
      logger.db(
        `Log: ${log.id} | Action: ${log.action} | Actor: ${log.actorType} ${log.actorId} | Resource: ${log.resource} ${log.resourceId}`
      );
    }

    return log;
  }

  async error(params: AuditLogParams) {
    const log = await prisma.errorLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: {
          ...params.requestInfo,
          ...params.metadata,
        },
      },
    });

    if (CONFIG.NODE_ENV !== 'test') {
      logger.db(
        `Error: ${log.id} | Actor: ${log.actorType} ${log.actorId} | Resource: ${log.resource} ${log.resourceId}`
      );
    }

    return log;
  }

  async jobLog(data: Prisma.JobLogCreateInput) {
    const log = await prisma.jobLog.create({
      data,
    });

    if (CONFIG.NODE_ENV !== 'test') {
      logger.task(
        `Job Log: ${log.id} | Job: ${log.jobName} | Status: ${log.status} | Job ID: ${log.jobId}`
      );
    }

    return log;
  }
}

const databaseLogger = new DatabaseLogger();

export { DatabaseLogger };
export default databaseLogger;
