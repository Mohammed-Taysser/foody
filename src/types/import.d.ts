import { ActionType, ActorType, Prisma, ResourceType, User } from '@prisma/client';
import { Request } from 'express';

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

interface BaseLogParams {
  request: Request<unknown, unknown, unknown, unknown>;
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

export { AuditLogParams, AuthenticatedRequest, ErrorLogParams };
