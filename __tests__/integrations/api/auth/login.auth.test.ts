import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../../src/app';
import prisma from '../../../../src/apps/prisma';
import tokenService from '../../../../src/services/token.service';

const endpoint = '/api/auth/login';
const registerEndpoint = '/api/auth/register';

describe('/auth/login - Success Cases', () => {
  it('should login and return tokens + user', async () => {
    const dummyEmail = faker.internet.email();
    const dummyPassword = '123456789';

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: dummyPassword,
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: dummyPassword,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.accessToken).toBeDefined();
    expect(res.body.data.data.refreshToken).toBeDefined();
    expect(res.body.data.data.user.email).toBe(dummyEmail);
  });

  it('should reset failed login attempts on successful login', async () => {
    const dummyEmail = faker.internet.email();
    const dummyPassword = '123456789';

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: dummyPassword,
    });

    // 2 failed logins
    for (let i = 0; i < 2; i++) {
      await request(app).post(endpoint).send({
        email: dummyEmail,
        password: 'wrong_pass',
      });
    }

    // Successful login
    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: dummyPassword,
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
      password: 'wrong_pass',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail when email is missing', async () => {
    const res = await request(app).post(endpoint).send({
      password: '123456789',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('should fail when password is missing', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('should fail with invalid email format', async () => {
    const res = await request(app).post(endpoint).send({
      email: 'not-an-email',
      password: '123456789',
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
    const dummyPassword = '123456789';

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: dummyPassword,
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: 'wrong_pass',
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
        password: await tokenService.hash('123456789'),
        isActive: true,
        isBlocked: false,
        isEmailVerified: true,
      },
    });

    await request(app).post(endpoint).send({
      email,
      password: 'wrongpass',
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.failedLoginAttempts).toBe(1);
  });

  it('should block user after 5 failed login attempts', async () => {
    const dummyEmail = faker.internet.email();
    const dummyPassword = '123456789';

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: dummyPassword,
    });

    for (let i = 0; i < 5; i++) {
      await request(app).post(endpoint).send({
        email: dummyEmail,
        password: 'wrong_pass',
      });
    }

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: 'wrong_pass',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should not allow login if user is blocked', async () => {
    const dummyEmail = faker.internet.email();
    const dummyPassword = '123456789';

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: dummyPassword,
    });

    await prisma.user.update({
      where: { email: dummyEmail },
      data: { isBlocked: true },
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: dummyPassword,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should not allow login if user is inactive', async () => {
    const dummyEmail = faker.internet.email();
    const dummyPassword = '123456789';

    await request(app).post(registerEndpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: dummyPassword,
    });

    await prisma.user.update({
      where: { email: dummyEmail },
      data: { isActive: false },
    });

    const res = await request(app).post(endpoint).send({
      email: dummyEmail,
      password: dummyPassword,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
