import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';

import CONFIG from '@/config/env';

interface CreateTokenPayload {
  userId: string;
  email: string;
  role: Role;
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function generateToken(payload: CreateTokenPayload) {
  return jwt.sign(payload, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export { comparePassword, generateToken, hashPassword };
