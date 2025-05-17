class BaseError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends BaseError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends BaseError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

class InternalServerError extends BaseError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

export {
  BaseError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
};
