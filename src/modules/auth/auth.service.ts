import { Role, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import CONFIG from '@/config/env';

interface CreateTokenPayload {
  id: string;
  email: string;
  role: Role;
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function generateRefreshToken(payload: CreateTokenPayload): string {
  return jwt.sign(payload, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function generateAccessToken(payload: CreateTokenPayload): string {
  return jwt.sign(payload, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function verifyToken(token: string) {
  return jwt.verify(token, CONFIG.JWT_SECRET) as User;
}

export { comparePassword, generateAccessToken, generateRefreshToken, hashPassword, verifyToken };
