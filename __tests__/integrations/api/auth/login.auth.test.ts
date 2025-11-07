import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';
import CONFIG from '@/apps/config';
import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';

const endpoint = '/api/auth/login';
const registerEndpoint = '/api/auth/register';

describe('/auth/login - Success Cases', () => {
  it('should login and return tokens + user', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.accessToken).toBeDefined();
    expect(res.body.data.data.refreshToken).toBeDefined();
    expect(res.body.data.data.user.email).toBe(dummyEmail);
  });

  it('should reset failed login attempts on successful login', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    // 2 failed logins
    for (let i = 0; i < 2; i++) {
      await request(app).post(endpoint).send({
        email: dummyEmail,
        password: randomUUID(), // Wrong password
      });
    }

    // Successful login
    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(200);

    const user = await prisma.user.findUnique({
      where: { email: dummyEmail },
    });

    expect(user?.failedLoginAttempts).toBe(0);
  });
});

describe('/auth/login - Validation Failures', () => {
  it('should reject login with invalid credentials', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'wrong@example.com',
      password: randomUUID(), // Wrong password
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when email is missing', async () => {
    const res = await request(app).post(endpoint).send({
      password: randomUUID(), // Wrong password
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when password is missing', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail with invalid email format', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'not-an-email',
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return error for missing both fields', async () => {
    const res = await request(app).post(endpoint).send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when password is incorrect', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: randomUUID(), // Wrong password
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('/auth/login - Security & Account States', () => {
  it('should increment failed attempts on wrong password', async () => {
    const email = faker.internet.email();
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email,
        password: await tokenService.hash(randomUUID()),
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
      },
    });

    await request(app).post(endpoint).send({
      email,
      password: randomUUID(), // Wrong password
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.failedLoginAttempts).toBe(1);
  });

  it('should block user after 5 failed login attempts', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    for (let i = 0; i < 5; i++) {
      await request(app).post(endpoint).send({
        email: dummyEmail,
        password: randomUUID(), // Wrong password
      });
    }

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: randomUUID(), // Wrong password
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should not allow login if user is blocked', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    await prisma.user.update({
      where: { email: dummyEmail },
      data: { isBlocked: true },
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should not allow login if user is inactive', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    await prisma.user.update({
      where: { email: dummyEmail },
      data: { isActive: false },
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
