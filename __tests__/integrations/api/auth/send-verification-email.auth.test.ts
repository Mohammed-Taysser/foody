import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../../src/app';
import prisma from '../../../../src/apps/prisma';
import tokenService from '../../../../src/services/token.service';

const endpoint = '/api/auth/send-verification-email';
const loginEndpoint = '/api/auth/login';

describe('POST /auth/send-verification-email - Success', () => {
  it('should generate and store a verification token for valid user', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: await tokenService.hash('pass-123456'),
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        isEmailVerified: false,
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
    });

    expect(res.statusCode).toBe(200);
  });
});

describe('POST /auth/send-verification-email - Failure', () => {
  it('should fail if user not found', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
      resetToken: 'invalid',
      password: 'new-password',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail if no token is provided', async () => {
    const res = await request(app).post(endpoint).send();
    expect(res.statusCode).toBe(400);
  });

  it('should reject if user is blocked', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: await tokenService.hash('pass-123456'),
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const loginResponse = await request(app).post(loginEndpoint).send({
      email,
      password: 'pass-123456',
    });

    const token = loginResponse.body.data.data.accessToken;

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        isBlocked: true,
      },
    });

    const res = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send({
      email,
    });

    expect(res.statusCode).toBe(401);
  });

  it('should reject if user is inactive', async () => {
    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        email,
        password: await tokenService.hash('pass-123456'),
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
        name: 'User',
      },
    });

    const loginResponse = await request(app).post(loginEndpoint).send({
      email,
      password: 'pass-123456',
    });

    const token = loginResponse.body.data.data.accessToken;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isActive: false,
      },
    });

    const res = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send({
      email,
    });

    expect(res.statusCode).toBe(401);
  });

  it('should reject if user is already verified', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: await tokenService.hash('pass-123456'),
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const loginResponse = await request(app).post(loginEndpoint).send({
      email,
      password: 'pass-123456',
    });

    const token = loginResponse.body.data.data.accessToken;

    const res = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send({
      email,
    });

    expect(res.statusCode).toBe(400);
  });
});
