import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: User;
}

export { AuthenticatedRequest };
