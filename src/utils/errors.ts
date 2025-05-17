class BaseError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string | string[], statusCode: number, isOperational = true) {
    super(Array.isArray(message) ? message.join('\n') : message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends BaseError {
  constructor(message: string | string[] = 'Bad Request') {
    super(message, 400);
  }
}

class UnauthorizedError extends BaseError {
  constructor(message: string | string[] = 'Unauthorized') {
    super(message, 401);
  }
}

class NotFoundError extends BaseError {
  constructor(message: string | string[] = 'Not Found') {
    super(message, 404);
  }
}

class ForbiddenError extends BaseError {
  constructor(message: string | string[] = 'Forbidden') {
    super(message, 403);
  }
}

class ConflictError extends BaseError {
  constructor(message: string | string[] = 'Conflict') {
    super(message, 409);
  }
}

class InternalServerError extends BaseError {
  constructor(message: string | string[] = 'Internal Server Error') {
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
