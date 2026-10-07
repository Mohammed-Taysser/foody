class BaseError extends Error {
  public statusCode: number;

  constructor(error: ErrorContent, statusCode: number) {
    const resolvedMessage = JSON.stringify(error);

    super(resolvedMessage);
    this.statusCode = statusCode;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Derived error classes
class BadRequestError extends BaseError {
  constructor(error: ErrorContent = 'errors:bad-request') {
    super(error, 400);
  }
}

class UnauthorizedError extends BaseError {
  constructor(error: ErrorContent = 'errors:unauthorized') {
    super(error, 401);
  }
}

class NotFoundError extends BaseError {
  constructor(error: ErrorContent = 'errors:not-found') {
    super(error, 404);
  }
}

class ForbiddenError extends BaseError {
  constructor(error: ErrorContent = 'errors:forbidden') {
    super(error, 403);
  }
}

class ConflictError extends BaseError {
  constructor(error: ErrorContent = 'errors:conflict') {
    super(error, 409);
  }
}

class InternalServerError extends BaseError {
  constructor(error: ErrorContent = 'errors:internal-server-error') {
    super(error, 500);
  }
}

class TooManyRequestsError extends BaseError {
  constructor(error: ErrorContent = 'errors:too-many-requests') {
    super(error, 429);
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
