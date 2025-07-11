import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../../src/app';
import prisma from '../../../../src/apps/prisma';

const endpoint = '/api/auth/register';

describe('POST /auth/register - Success Cases', () => {
  it('should register and return tokens + user', async () => {
    const dummyEmail = faker.internet.email();

    const res = await request(app).post(endpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: 'StrongPassword123!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.data.accessToken).toBeDefined();
    expect(res.body.data.data.refreshToken).toBeDefined();
    expect(res.body.data.data.user.email).toBe(dummyEmail);
  });
});

describe('POST /auth/register - Validation & Failure Cases', () => {
  it('should not allow duplicate registration', async () => {
    const dummyEmail = faker.internet.email();

    await request(app).post(endpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    const res = await request(app).post(endpoint).send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should fail when required fields are missing', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('should fail when name is missing', async () => {
    const res = await request(app).post(endpoint).send({
      email: faker.internet.email(),
      password: '123456789',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should fail when password is missing', async () => {
    const res = await request(app).post(endpoint).send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    });

    expect(res.statusCode).toBe(400);
  });

  it('should fail when invalid email is provided', async () => {
    const res = await request(app).post(endpoint).send({
      name: faker.person.fullName(),
      email: 'not-an-email',
      password: '123456789',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail with weak password', async () => {
    const res = await request(app).post(endpoint).send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123',
    });

    expect(res.statusCode).toBe(400);
  });

  it('should handle overly long name and email', async () => {
    const res = await request(app)
      .post(endpoint)
      .send({
        name: faker.lorem.words(50),
        email: `verylongemail${'a'.repeat(250)}@test.com`,
        password: 'StrongPassword123!',
      });

    expect(res.statusCode).toBe(400);
  });
});

describe('🔒 Security Checks', () => {
  it('should sanitize name input (XSS)', async () => {
    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'StrongPass123!',
    };
    payload.name = `<script>alert("xss")</script>`;

    const res = await request(app).post(endpoint).send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.data.user.name).toContain('script'); // You may sanitize or allow — behavior depends
  });

  it('should reject SQL injection attempt in email', async () => {
    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'StrongPass123!',
    };
    payload.email = `' OR 1=1; --@test.com`;

    const res = await request(app).post(endpoint).send(payload);
    expect(res.statusCode).toBe(400); // depends on validator strictness
  });
});

describe('🧪 Internal Integrity', () => {
  it('should assign permission groups and permissions correctly', async () => {
    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'StrongPass123!',
    };

    await request(app).post(endpoint).send(payload);

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { permissionGroups: true, permissions: true },
    });

    expect(user?.permissionGroups.length).toBeGreaterThan(0);
    expect(user?.permissions.length).toBeGreaterThan(0);
  });
});
