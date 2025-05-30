import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('POST /auth/register', () => {
  it('should register and return tokens + user', async () => {
    const dummyEmail = faker.internet.email();

    const res = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(dummyEmail);
  });

  it('should not allow duplicate registration', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /auth/login', () => {
  it('should reject login with invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrong@example.com',
      password: 'wrong_pass',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should login and return tokens + user', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: dummyEmail,
      password: '123456789',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(dummyEmail);
  });
});

describe('POST /auth/refresh', () => {
  it('should refresh token', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: dummyEmail,
      password: '123456789',
    });

    const refreshToken = loginResponse.body.data.refreshToken;

    const refreshResponse = await request(app).post('/api/auth/refresh').send({
      refreshToken,
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.data.accessToken).toBeDefined();
    expect(refreshResponse.body.data.refreshToken).toBeDefined();
  });

  it('should fail refresh with no token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
