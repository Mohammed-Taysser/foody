import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';
import CONFIG from '@/apps/config';
import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';

const endpoint = '/api/auth/verify-reset-password';

describe('POST /auth/verify-reset-password - Success', () => {
  it('should verify and reset password with valid token', async () => {
    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        email,
        password: await tokenService.hash('old-pass'),
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const token = tokenService.signResetPasswordToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetSentAt: new Date(),
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: token,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /auth/verify-reset-password - Failure', () => {
  it('should return 400 for invalid or expired token', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: CONFIG.TEST_USER_PASSWORD,
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        passwordResetToken: randomUUID(),
        passwordResetSentAt: new Date(Date.now() - 2 * 3600000),
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({
      token: randomUUID(),
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail if user not found', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
      resetToken: 'invalid',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail if user is not active', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        isActive: false,
        isBlocked: false,
        isEmailVerified: true,
        password: await tokenService.hash('old-pass'),
        name: 'Inactive',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: 'invalid',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail if user is blocked', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        isActive: true,
        isBlocked: true,
        isEmailVerified: true,
        password: await tokenService.hash('old-pass'),
        name: 'Blocked',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: 'invalid',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail if email not verified', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
        password: await tokenService.hash('old-pass'),
        name: 'Unverified',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: 'any-token',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail if token or sentAt is missing', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        password: await tokenService.hash('old-pass'),
        name: 'No Token',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: 'some-token',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail if token is expired > 2h', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        password: await tokenService.hash('old-pass'),
        name: 'Expired Token',
        passwordResetToken: randomUUID(),
        passwordResetSentAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: randomUUID(),
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail if token is invalid', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        password: await tokenService.hash('old-pass'),
        name: 'Invalid Token',
        passwordResetToken: randomUUID(),
        passwordResetSentAt: new Date(),
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: 'invalid-token',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post(endpoint).send({});
    expect(res.statusCode).toBe(400);
  });

  it('should reject weak passwords', async () => {
    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        email,
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        password: await tokenService.hash('old-pass'),
        name: 'Invalid Token',
        passwordResetToken: randomUUID(),
        passwordResetSentAt: new Date(),
      },
    });

    const token = tokenService.signResetPasswordToken(user);

    const res = await request(app).post(endpoint).send({
      email,
      resetToken: token,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
  });
});
