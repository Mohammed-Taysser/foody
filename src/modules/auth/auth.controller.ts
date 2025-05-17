import { Request, Response } from 'express';

import { comparePassword, generateToken, hashPassword } from './auth.service';

import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, UnauthorizedError } from '@/utils/errors';
import sendResponse from '@/utils/sendResponse';
import prisma from '@/config/prisma';

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

  const token = generateToken({ userId: newUser.id, email: newUser.email, role: newUser.role });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = newUser;

  sendResponse({ res, message: 'User registered', data: { token, user: restUser } });
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

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = user;

  sendResponse({ res, message: 'Login successful', data: { token, user: restUser } });
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

export { getProfile, login, register };
