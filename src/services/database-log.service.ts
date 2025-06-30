import { Prisma } from '@prisma/client';

import WINSTON_LOGGER from './winston-log.service';

import CONFIG from '@/config/config';
import prisma from '@/config/prisma';
import { AuditLogParams, ErrorLogParams } from '@/types/import';
import { formatDeepDiff } from '@/utils/deep-diff.utils';

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
    WINSTON_LOGGER.info(
      `Log: ${auditLog.id} | Action: ${action} | Actor: ${actorType} ${actorId} | Resource: ${resource} ${resourceId}`,
      'audit_log'
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
    WINSTON_LOGGER.error(
      `Error: ${errorLog.id} | Actor: ${params.actorType} ${params.actorId} | Resource: ${params.resource} ${params.resourceId}`,
      'audit_log'
    );
  }
}

const DATABASE_LOGGER = {
  log: logAction,
  error: logError,
};

export default DATABASE_LOGGER;
