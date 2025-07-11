import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../../src/app';
import prisma from '../../../../src/apps/prisma';

const endpoint = '/api/auth/reset-password';

describe('reset-password - Failure Cases', () => {
  it('should return 400 if user not found', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
      password: 'new-password',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if email is not provided', async () => {
    const res = await request(app).post(endpoint).send({
      password: 'new-password',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if password is not provided', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject if email is not verified', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'old-pass',
        name: 'User',
        isActive: true,
        isBlocked: false,
        isEmailVerified: false,
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      password: 'new-password',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject if user is blocked', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'old-pass',
        name: 'User',
        isActive: true,
        isBlocked: true,
        isEmailVerified: true,
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      password: 'new-password',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject if user is not active', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'old-pass',
        name: 'User',
        isActive: false,
        isBlocked: false,
        isEmailVerified: true,
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      password: 'new-password',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject weak or short passwords', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'old-pass',
        name: 'User',
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      password: '123',
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('reset-password - Success Case', () => {
  it('should reset password successfully', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'old-pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({
      email,
      password: 'new-password',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
