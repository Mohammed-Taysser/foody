import { Prisma } from '@prisma/client';
import { Request } from 'express';

import { ExtractedRequestInfo } from '@/types/import';

function getRequestInfo(
  request: Request<unknown, unknown, unknown, unknown>
): ExtractedRequestInfo {
  return {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    url: request.originalUrl,
    method: request.method,
    params: request.params as Prisma.InputJsonObject,
    body: request.body as Prisma.InputJsonObject,
    query: request.query as Prisma.InputJsonObject,
    headers: request.headers,
  };
}

export { getRequestInfo };
