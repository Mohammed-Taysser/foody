import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../../src/app';
import prisma from '../../../../src/apps/prisma';

const endpoint = '/api/auth/send-reset-password-code';

describe('POST /auth/send-reset-password-code - Failure Cases', () => {
  it('should return 400 if user not found', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if email is not provided', async () => {
    const res = await request(app).post(endpoint).send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'not-an-email',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject if user is not email-verified', async () => {
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

    const res = await request(app).post(endpoint).send({ email });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject if user is blocked', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: true,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({ email });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject if user is inactive', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: false,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({ email });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /auth/send-reset-password-code - Success Case', () => {
  it('should generate reset code for verified, active user', async () => {
    const email = faker.internet.email();
    await prisma.user.create({
      data: {
        email,
        password: 'pass',
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
        name: 'User',
      },
    });

    const res = await request(app).post(endpoint).send({ email });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
