import { Request, Response } from 'express';

import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyToken,
} from './auth.service';

import prisma from '@/config/prisma';
import { AuthenticatedRequest } from '@/types/import';
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

  const hashed = await hashPassword(data.password);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
    },
  });

  const payload = { id: newUser.id, email: newUser.email, role: newUser.role };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = newUser;

  sendResponse({
    res,
    message: 'User registered',
    data: { accessToken, refreshToken, user: restUser },
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

  const valid = await comparePassword(data.password, user.password);

  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = user;

  sendResponse({
    res,
    message: 'Login successful',
    data: { accessToken, refreshToken, user: restUser },
  });
}

function getProfile(req: Request, res: Response) {
  const request = req as AuthenticatedRequest;

  const user = request.user;

  if (!user) {
    throw new UnauthorizedError('Not authenticated');
  }

  sendResponse({
    res,
    message: 'Current user',
    data: user,
  });
}

function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  try {
    const payload = verifyToken(refreshToken);
    const newAccessToken = generateAccessToken(payload);

    sendResponse({
      res,
      message: 'New access token issued',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export { getProfile, login, register, refreshToken };
