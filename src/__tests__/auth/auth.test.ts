import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';
import prisma from '@/config/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Register', () => {
  it('should register and return tokens + user', async () => {
    const dummyEmail = faker.internet.email();

    const res = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    expect(res.statusCode).toBe(200);
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

describe('Login', () => {
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

describe('Refresh token', () => {
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

describe('Profile', () => {
  it('should get profile', async () => {
    const dummyEmail = faker.internet.email();

    const registerResponse = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    const accessToken = registerResponse.body.data.accessToken;

    const profileResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body.data.email).toBe(dummyEmail);
  });

  it('should fail profile if not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
