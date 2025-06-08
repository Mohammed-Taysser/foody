import { User } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: User;
  parsedQuery: Record<string, string | number>;
}

export { AuthenticatedRequest };
