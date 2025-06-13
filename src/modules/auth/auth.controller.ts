import { Role } from '@prisma/client';
import { Request, Response } from 'express';

import { DEFAULT_ROLE_PERMISSIONS } from './auth.constant';
import { LoginInput, RefreshTokenInput, RegisterInput } from './auth.validator';

import prisma from '@/config/prisma';
import DATABASE_LOGGER from '@/services/database-log.service';
import tokenService from '@/services/token.service';
import { BadRequestError, ConflictError, UnauthorizedError } from '@/utils/errors.utils';
import sendResponse from '@/utils/sendResponse';

async function register(req: Request<unknown, unknown, RegisterInput>, res: Response) {
  const data = req.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user) {
    throw new ConflictError('Email already registered');
  }

  const hashed = await tokenService.hash(data.password);

  const config = DEFAULT_ROLE_PERMISSIONS[data.role as Role];

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
      permissionGroups: {
        connect: config.groups.map((name) => ({ name })),
      },
      permissions: {
        connect: config.permissions.map((id) => ({ key: id })),
      },
    },
  });

  const payload = { id: newUser.id, email: newUser.email, role: newUser.role };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = newUser;

  DATABASE_LOGGER.log({
    request: req,
    actorId: newUser.id,
    actorType: 'USER',
    action: 'REGISTER',
    resource: 'USER',
    resourceId: newUser.id,
    metadata: { data: req.body },
  });

  sendResponse({
    res,
    message: 'User registered',
    data: { accessToken, refreshToken, user: restUser },
    statusCode: 201,
  });
}

async function login(req: Request<unknown, unknown, LoginInput>, res: Response) {
  const data = req.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  const valid = await tokenService.compare(data.password, user.password);

  if (!valid) {
    throw new BadRequestError('Invalid credentials');
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = user;

  DATABASE_LOGGER.log({
    request: req,
    actorId: user.id,
    actorType: 'USER',
    action: 'LOGIN',
    resource: 'USER',
    resourceId: user.id,
    metadata: { data: req.body },
  });

  sendResponse({
    res,
    message: 'Login successful',
    data: { accessToken, refreshToken, user: restUser },
  });
}

function refreshToken(req: Request<unknown, unknown, RefreshTokenInput>, res: Response) {
  const { refreshToken } = req.body;

  try {
    const payload = tokenService.verifyToken<UserTokenPayload>(refreshToken);

    const newAccessToken = tokenService.signAccessToken(payload);
    const newRefreshToken = tokenService.signRefreshToken(payload);

    DATABASE_LOGGER.log({
      request: req,
      actorId: payload.id,
      actorType: 'USER',
      action: 'REFRESH_TOKEN',
      resource: 'USER',
      resourceId: payload.id,
      metadata: { data: req.body },
    });

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
