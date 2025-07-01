import { Request, Response } from 'express';

import prisma from '../../src/config/prisma';
import authenticateMiddleware from '../../src/middleware/authenticate.middleware';
import tokenService from '../../src/services/token.service';
import { AuthenticatedRequest } from '../../src/types/import';
import { UnauthorizedError } from '../../src/utils/errors.utils';

// Mocks
jest.mock('../../src/services/token.service');
jest.mock('../../src/config/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockVerifyToken = tokenService.verifyToken as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;

describe('Authenticate middleware', () => {
  const mockNext = jest.fn();
  const mockRes = {} as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedError if Authorization header is missing', async () => {
    const req = { headers: {} } as Request;

    await expect(authenticateMiddleware(req, mockRes, mockNext)).rejects.toThrow(UnauthorizedError);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError if token is invalid', async () => {
    const req = {
      headers: { authorization: 'Bearer invalidtoken' },
    } as Request;

    mockVerifyToken.mockReturnValue(null);

    await expect(authenticateMiddleware(req, mockRes, mockNext)).rejects.toThrow('Invalid token');

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError if token payload is a string', async () => {
    const req = {
      headers: { authorization: 'Bearer sometoken' },
    } as Request;

    mockVerifyToken.mockReturnValue('not-an-object');

    await expect(authenticateMiddleware(req, mockRes, mockNext)).rejects.toThrow('Invalid token');

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError if user not found', async () => {
    const req = {
      headers: { authorization: 'Bearer validtoken' },
    } as Request;

    mockVerifyToken.mockReturnValue({ id: 1 });
    mockFindUnique.mockResolvedValue(null);

    await expect(authenticateMiddleware(req, mockRes, mockNext)).rejects.toThrow('Invalid token');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        permissions: true,
        permissionGroups: { include: { permissions: true } },
      },
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should attach user to request and call next if token is valid and user exists', async () => {
    const req = {
      headers: { authorization: 'Bearer validtoken' },
    } as Request;

    const user = { id: 1, email: 'test@example.com' };
    mockVerifyToken.mockReturnValue({ id: 1 });
    mockFindUnique.mockResolvedValue(user);

    const requestWithUser = req as AuthenticatedRequest;

    await authenticateMiddleware(req, mockRes, mockNext);

    expect(requestWithUser.user).toEqual(user);
    expect(mockNext).toHaveBeenCalled();
  });
});
