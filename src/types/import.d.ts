import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export { AuthenticatedRequest };
