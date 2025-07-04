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

class BadRequestError extends BaseError {
  constructor(message: ErrorMiddlewareDetails = 'Bad Request') {
    super(message, 400);
  }
}

class UnauthorizedError extends BaseError {
  constructor(message: ErrorMiddlewareDetails = 'Unauthorized') {
    super(message, 401);
  }
}

class NotFoundError extends BaseError {
  constructor(message: ErrorMiddlewareDetails = 'Not Found') {
    super(message, 404);
  }
}

class ForbiddenError extends BaseError {
  constructor(message: ErrorMiddlewareDetails = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends BaseError {
  constructor(message: ErrorMiddlewareDetails = 'Conflict') {
    super(message, 409);
  }
}

class InternalServerError extends BaseError {
  constructor(message: ErrorMiddlewareDetails = 'Internal Server Error') {
    super(message, 500);
  }
}

export {
  BadRequestError,
  BaseError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
};
