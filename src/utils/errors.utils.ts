import { ErrorMiddlewareDetails } from '@/types/import';

class BaseError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details: ErrorMiddlewareDetails;

  constructor(error: ErrorMiddlewareDetails, statusCode: number, isOperational = true) {
    const resolvedMessage = typeof error === 'string' ? error : 'An error occurred';

    super(resolvedMessage);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = typeof error === 'string' ? { error: resolvedMessage } : error;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Derived error classes
class BadRequestError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:bad-request') {
    super(details, 400);
  }
}

class UnauthorizedError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:unauthorized') {
    super(details, 401);
  }
}

class NotFoundError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:not-found') {
    super(details, 404);
  }
}

class ForbiddenError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:forbidden') {
    super(details, 403);
  }
}

class ConflictError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:conflict') {
    super(details, 409);
  }
}

class InternalServerError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:internal-server-error') {
    super(details, 500);
  }
}

class TooManyRequestsError extends BaseError {
  constructor(details: ErrorMiddlewareDetails = 'errors:too-many-requests') {
    super(details, 429);
  }
}

export {
  BadRequestError,
  BaseError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
};
