import { Prisma } from '@prisma/client';

import CONFIG from '@/config/config';
import prisma from '@/config/prisma';
import { AuditLogParams, ErrorLogParams } from '@/types/import';
import { formatDeepDiff } from '@/utils/deep-diff.utils';
import logger from '@/utils/logger.utils';

async function logAction(params: AuditLogParams) {
  const {
    actorId,
    action,
    actorType,
    resource,
    resourceId,
    oldData,
    newData,
    metadata,
    requestInfo,
  } = params;

  const diff = oldData && newData ? formatDeepDiff(oldData, newData) : {};

  const auditLog = await prisma.auditLog.create({
    data: {
      actorType,
      actorId,
      action,
      resource,
      resourceId,
      diff: diff as Prisma.InputJsonObject,
      metadata: {
        ...requestInfo,
        ...metadata,
      },
    },
  });

  if (CONFIG.NODE_ENV !== 'test') {
    logger.db(
      `Log: ${auditLog.id} | Action: ${action} | Actor: ${actorType} ${actorId} | Resource: ${resource} ${resourceId}`
    );
  }
}

async function logError(params: ErrorLogParams) {
  const errorLog = await prisma.errorLog.create({
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
      `Error: ${errorLog.id} | Actor: ${params.actorType} ${params.actorId} | Resource: ${params.resource} ${params.resourceId}`
    );
  }
}

const DATABASE_LOGGER = {
  log: logAction,
  error: logError,
};

export default DATABASE_LOGGER;
