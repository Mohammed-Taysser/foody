import { NextFunction, Request, Response } from 'express';

import errorHandlerMiddleware from '@/middleware/error.middleware';
import { ErrorMiddlewareDetails } from '@/types/error';
import { NotFoundError } from '@/utils/errors.utils';

jest.mock('@/config/env', () => ({
  __esModule: true,
  default: { NODE_ENV: 'test' }, // default to test env
}));

describe('Error middleware', () => {
  const mockReq = {} as Request;
  const mockNext = jest.fn() as NextFunction;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should handle BaseError and return status, message, and details', () => {
    const errorObject: ErrorMiddlewareDetails = [
      {
        code: 'invalid_literal',
        expected: 'ZodParsedType',
        received: 'ZodParsedType',
        path: ['body', 'name'],
        message: 'Expected ZodParsedType, received ZodParsedType',
      },
    ];

    const error = new NotFoundError(errorObject);

    errorHandlerMiddleware(error, mockReq, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'An error occurred',
      details: errorObject,
    });
  });

  it('should handle generic Error and return 500 with default message', () => {
    const error = new Error('Something went wrong');

    errorHandlerMiddleware(error, mockReq, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong',
      details: undefined,
    });
  });

  it('should include stack trace in development mode', async () => {
    // Force development env
    jest.resetModules(); // Clear cached modules to reload env
    jest.doMock('@/config/env', () => ({
      __esModule: true,
      default: { NODE_ENV: 'development' },
    }));

    // Re-import after mocking env
    const { default: errorHandlerMiddleware } = await import('@/middleware/error.middleware');

    const error = new Error('Dev error');
    error.stack = 'Error stack trace';

    const devRes: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    errorHandlerMiddleware(error, mockReq, devRes as Response, mockNext);

    expect(devRes.status).toHaveBeenCalledWith(500);
    expect(devRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Dev error',
        stack: 'Error stack trace',
      })
    );
  });
});
