import { ActionType, ActorType, Prisma, ResourceType, User } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
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
  parsedQuery: Record<string, string | number>;
}

interface BaseLogParams {
  request: Request;
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

export { AuthenticatedRequest, AuditLogParams, ErrorLogParams };
