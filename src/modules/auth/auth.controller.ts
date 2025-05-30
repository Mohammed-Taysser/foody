import { Request, Response } from 'express';

import prisma from '@/config/prisma';
import tokenService from '@/services/token.service';
import { BadRequestError, UnauthorizedError } from '@/utils/errors';
import sendResponse from '@/utils/sendResponse';

async function register(req: Request, res: Response) {
  const data = req.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user) {
    throw new BadRequestError('Email already registered');
  }

  const hashed = await tokenService.hash(data.password);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
    },
  });

  const payload = { id: newUser.id, email: newUser.email, role: newUser.role };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = newUser;

  sendResponse({
    res,
    message: 'User registered',
    data: { accessToken, refreshToken, user: restUser },
    statusCode: 201,
  });
}

async function login(req: Request, res: Response) {
  const data = req.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const valid = await tokenService.compare(data.password, user.password);

  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = user;

  sendResponse({
    res,
    message: 'Login successful',
    data: { accessToken, refreshToken, user: restUser },
  });
}

function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  try {
    const payload = tokenService.verifyToken<UserTokenPayload>(refreshToken);

    const newAccessToken = tokenService.signAccessToken(payload);
    const newRefreshToken = tokenService.signRefreshToken(payload);

    sendResponse({
      res,
      message: 'New access token issued',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export { login, refreshToken, register };
