import { NextFunction, Request, Response } from 'express';

import { AuthenticatedRequest } from '@/types/import';
import { ForbiddenError } from '@/utils/errors.utils';

function requirePermission(requiredPermissions: PermittedId[], isPublic = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const request = req as AuthenticatedRequest;
    const user = request.user;

    // Public endpoint: no check needed
    if (isPublic) {
      return next();
    }

    // If user is ADMIN, bypass permission check
    if (user.role === 'ADMIN') {
      return next();
    }

    if (!user) {
      throw new ForbiddenError('You must be logged in to perform this action');
    }

    const effectivePermissions = new Set([
      ...user.permissions.map((p) => p.key),
      ...user.permissionGroups.flatMap((g) => g.permissions.map((p) => p.key)),
    ]);

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((p) => effectivePermissions.has(p));

    if (!hasAllPermissions) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }

    next();
  };
}

export default requirePermission;
