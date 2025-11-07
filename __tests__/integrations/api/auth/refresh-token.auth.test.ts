import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';
import CONFIG from '@/apps/config';

const endpoint = '/api/auth/refresh-token';

describe('POST /auth/refresh-token - Success Cases', () => {
  it('should refresh token with valid refreshToken', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: dummyEmail,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const refreshToken = loginResponse.body.data.data.refreshToken;

    const refreshResponse = await request(app).post(endpoint).send({
      refreshToken,
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.data.data.accessToken).toBeDefined();
    expect(refreshResponse.body.data.data.refreshToken).toBeDefined();
  });
});

describe('POST /auth/refresh-token - Failure Cases', () => {
  it('should fail when no token is provided', async () => {
    const res = await request(app).post(endpoint).send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail with invalid refresh token format', async () => {
    const res = await request(app).post(endpoint).send({
      refreshToken: 'invalid.token.value',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Optional: Include if refresh tokens expire or are revoked
  it('should fail with expired or revoked refresh token', async () => {
    // This requires mocking token expiry or revocation logic
    const res = await request(app).post(endpoint).send({
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE=',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
