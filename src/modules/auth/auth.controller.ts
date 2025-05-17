import { Request, Response } from 'express';

import { comparePassword, generateToken, hashPassword } from './auth.service';

import { BadRequestError, UnauthorizedError } from '@/utils/errors';
import sendResponse from '@/utils/sendResponse';

// Mock user storage (replace with DB later)
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}
const users: User[] = [];

async function register(req: Request, res: Response) {
  const data = req.body;

  const exists = users.find((u) => u.email === data.email);
  if (exists) throw new BadRequestError('Email already registered');

  const hashed = await hashPassword(data.password);
  const newUser = { id: users.length + 1, name: data.name, email: data.email, password: hashed };

  users.push(newUser);

  const token = generateToken({ userId: newUser.id.toString(), email: newUser.email });

  sendResponse({ res, message: 'User registered', data: { token } });
}

async function login(req: Request, res: Response) {
  const data = req.body;

  const user = users.find((u) => u.email === data.email);
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const token = generateToken({ userId: user.id.toString(), email: user.email });

  sendResponse({ res, message: 'Login successful', data: { token } });
}

export { login, register };
