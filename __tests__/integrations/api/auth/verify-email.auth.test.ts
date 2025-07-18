import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../../src/app';
import prisma from '../../../../src/apps/prisma';
import tokenService from '../../../../src/services/token.service';

const endpoint = '/api/auth/verify-email';
const loginEndpoint = '/api/auth/login';

describe('POST /auth/verify-email - Success', () => {
  it('should verify email with valid token', async () => {
    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
        name: 'User',
      },
    });

    const token = tokenService.signEmailVerificationToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      verificationToken: token,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /auth/verify-email - Failure', () => {
  it('should fail if user not found', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
      verificationToken: 'invalid',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject if user is inactive', async () => {
    const email = faker.internet.email();
    const user = await prisma.user.create({
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
        id: user.id,
      },
      data: {
        isActive: false,
      },
    });

    const res = await request(app).post(endpoint).set('Authorization', `Bearer ${token}`).send({
      email,
      verificationToken: 'invalid',
    });

    expect(res.statusCode).toBe(401);
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
      verificationToken: 'invalid',
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
      verificationToken: 'invalid',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject if token is missing', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      verificationToken: 'bad.token.value',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject if token is invalid', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
        emailVerificationSentAt: new Date(),
        emailVerificationToken: 'token',
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      verificationToken: 'bad.token.value',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject if token is expired (>1h)', async () => {
    const expiredTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
        name: 'User',
        emailVerificationToken: 'token',
        emailVerificationSentAt: expiredTime,
      },
    });

    const token = tokenService.signEmailVerificationToken(user);

    const res = await request(app).post(endpoint).send({
      email,
      verificationToken: token,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject if no token or sent time in DB', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        emailVerificationSentAt: null,
        emailVerificationToken: null,
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      verificationToken: 'whatever',
    });

    expect(res.statusCode).toBe(400);
  });
});
