import { ActionType, ActorType, Prisma, ResourceType, User } from '@prisma/client';
import { Request } from 'express';
import { ZodIssue } from 'zod';

interface AuthenticatedRequest<
  Params = unknown,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user: User & {
    permissions: {
      id: string;
      key: string;
    }[];
    permissionGroups: {
      permissions: {
        id: string;
        key: string;
      }[];
    }[];
  };
  parsedQuery: ReqQuery;
}

interface ExtractedRequestInfo {
  ip: string | undefined;
  userAgent: string | undefined;
  url: string;
  method: string;
  params: Prisma.InputJsonObject;
  body: Prisma.InputJsonObject;
  query: Prisma.InputJsonObject;
  headers: Prisma.InputJsonObject;
}

interface BaseLogParams {
  requestInfo: ExtractedRequestInfo;
  actorId: string;
  actorType: ActorType;
  resource: ResourceType;
  resourceId: string;
  metadata?: Prisma.InputJsonObject;
}

interface AuditLogParams extends BaseLogParams {
  action: ActionType;
  actorType: ActorType;
  oldData?: Prisma.InputJsonObject;
  newData?: Prisma.InputJsonObject;
}

interface ErrorLogParams extends BaseLogParams {
  metadata: Prisma.InputJsonObject;
}

type ErrorMiddlewareDetails = string | { message?: string; [key: string]: unknown } | ZodIssue[];

interface ErrorMiddlewareResponse {
  success: boolean;
  message: string;
  details?: ErrorMiddlewareDetails;
  stack?: string;
  path?: string;
  method?: string;
}

export {
  AuditLogParams,
  AuthenticatedRequest,
  ErrorLogParams,
  ExtractedRequestInfo,
  ErrorMiddlewareDetails,
  ErrorMiddlewareResponse,
};
