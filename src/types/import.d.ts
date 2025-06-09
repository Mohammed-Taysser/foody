import { User } from '@prisma/client';
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

export { AuthenticatedRequest };
