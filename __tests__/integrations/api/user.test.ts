import { randomInt } from 'node:crypto';

import { faker } from '@faker-js/faker';
import { User } from '@prisma/client';
import { ADMIN_EMAIL, CUSTOMER_EMAIL, MOCK_IMAGE_PATH, OWNER_EMAIL } from '@tests/test.constants';
import { parseCsvResponse, parseExcelResponse } from '@tests/test.utils';
import ExcelJS from 'exceljs';
import request from 'supertest';

import app from '@/app';
import CONFIG from '@/apps/config';
import prisma from '@/apps/prisma';
import dayjsTZ from '@/utils/dayjs.utils';

describe('GET /users/me', () => {
  it('should get profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const accessToken = res.body.data.data.accessToken;

    const profileResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body.data.data.email).toBe(CUSTOMER_EMAIL);
  });

  it('should fail profile if not authenticated', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /me/permissions', () => {
  it('should get permissions', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const accessToken = res.body.data.data.accessToken;

    const permissionResponse = await request(app)
      .get('/api/users/me/permissions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(permissionResponse.statusCode).toBe(200);
  });
});

describe('PATCH /users/me', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: OWNER_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    accessToken = res.body.data.data.accessToken;
  });

  it('should update user profile successfully', async () => {
    const newName = faker.person.fullName();

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: newName });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.name).toBe(newName);
    expect(res.body.message).toBe('User profile updated');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: 'Hacker' });

    expect(res.statusCode).toBe(401);
  });

  it('should fail if invalid data is sent', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '' }); // invalid if schema requires non-empty name

    expect(res.statusCode).toBe(400);
  });

  it('should fail to update if email is already taken', async () => {
    // Register a second user to create an existing email conflict
    const secondUserRes = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const existingEmail = secondUserRes.body.data.data.user.email;

    // Try to update the first user’s email to the second user’s email
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: existingEmail });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should update user profile with image', async () => {
    const newName = faker.person.fullName();

    const meResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    const me = meResponse.body.data.data;

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('name', newName)
      .attach('image', MOCK_IMAGE_PATH);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.name).toBe(newName);
    expect(res.body.data.data.image).not.toBe(me.image); // Ensure image has changed
  });
});

describe('GET /users', () => {
  it('should list users', async () => {
    const res = await request(app).get('/api/users');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data).toHaveProperty('metadata');
  });

  describe('Filters', () => {
    it('should filter users by role', async () => {
      const res = await request(app).get('/api/users').query({ role: 'CUSTOMER' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.role === 'CUSTOMER')).toBe(true);
    });

    it('should filter users by name', async () => {
      const name = faker.person.fullName();
      const res = await request(app).get(`/api/users`).query({ name });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.name.includes(name))).toBe(true);
    });

    it('should filter users by email', async () => {
      const email = faker.internet.email();
      const res = await request(app).get(`/api/users`).query({ email });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.email.includes(email))).toBe(true);
    });

    it('should filter by failedLoginAttempts', async () => {
      const attempts = randomInt(0, 5); // Random number between 1 and 5
      const res = await request(app).get('/api/users').query({ failedLoginAttempts: attempts });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.failedLoginAttempts === attempts)).toBe(
        true
      );
    });

    it('should filter by lastFailedLogin[startDate]', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          lastFailedLogin: new Date(), // Set lastFailedLogin to today
          failedLoginAttempts: 1,
        },
      });

      // Assuming the lastFailedLogin is set to today for the test user
      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          lastFailedLogin: {
            startDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      expect(
        res.body.data.data.every((user: User) => {
          if (!user.lastFailedLogin) {
            return false;
          }
          return dayjsTZ(user.lastFailedLogin).isSame(today, 'day');
        })
      ).toBe(true);

      res.body.data.data.forEach((user: User) => {
        const lastFailedLogin = dayjsTZ(user.lastFailedLogin);
        expect(lastFailedLogin.isSameOrAfter(today, 'day')).toBe(true);
      });
    });

    it('should filter by lastFailedLogin[endDate]', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          lastFailedLogin: new Date(), // Set lastFailedLogin to today
          failedLoginAttempts: 1,
        },
      });

      // Assuming the lastFailedLogin is set to today for the test user
      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          lastFailedLogin: {
            endDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const lastFailedLogin = dayjsTZ(user.lastFailedLogin);
        expect(lastFailedLogin.isSameOrBefore(today, 'day')).toBe(true);
      });
    });

    it('should filter by lastFailedLogin[startDate, endDate]', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          lastFailedLogin: new Date(), // Set lastFailedLogin to today
          failedLoginAttempts: 1,
        },
      });

      // Assuming the lastFailedLogin is set to today for the test user
      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          lastFailedLogin: {
            startDate: today,
            endDate: today,
          },
        });

      expect(res.statusCode).toBe(200);
      res.body.data.data.forEach((user: User) => {
        expect(user.lastFailedLogin).toBeTruthy();
        expect(dayjsTZ(user.lastFailedLogin).isSame(today, 'day')).toBe(true);
      });
    });

    it('should filter by createdAt[startDate]', async () => {
      await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          createdAt: {
            startDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const createdAt = dayjsTZ(user.createdAt);
        expect(createdAt.isSameOrAfter(today, 'day')).toBe(true);
      });
    });

    it('should filter by createdAt[endDate]', async () => {
      await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          createdAt: {
            endDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const created = dayjsTZ(user.createdAt);
        expect(created.isSameOrBefore(today, 'day')).toBe(true);
      });
    });

    it('should filter by createdAt[startDate, endDate]', async () => {
      await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          createdAt: {
            startDate: today,
            endDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const created = dayjsTZ(user.createdAt);
        expect(created.isBetween(today, today, 'day', '[]')).toBe(true);
      });
    });

    it('should filter by isEmailVerified', async () => {
      const res = await request(app).get('/api/users').query({ isEmailVerified: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.isEmailVerified)).toBe(true);
    });

    it('should filter by isBlocked', async () => {
      const res = await request(app).get('/api/users').query({ isBlocked: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.isBlocked)).toBe(true);
    });

    it('should filter by isActive', async () => {
      const res = await request(app).get('/api/users').query({ isActive: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.isActive)).toBe(true);
    });

    it('should filter by isPhoneVerified', async () => {
      const res = await request(app).get('/api/users').query({ isPhoneVerified: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.isPhoneVerified)).toBe(true);
    });

    it('should filter by maxTokens', async () => {
      const res = await request(app).get('/api/users').query({ maxTokens: 100 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.maxTokens <= 100)).toBe(true);
    });

    it('should filter by blockedAt[startDate]', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          isBlocked: true,
          blockedAt: new Date(),
          blockedById: 'some-id',
        },
      });

      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          blockedAt: {
            startDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const blockedAt = dayjsTZ(user.blockedAt);
        expect(blockedAt.isSameOrAfter(today, 'day')).toBe(true);
      });
    });

    it('should filter by blockedAt[endDate]', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          isBlocked: true,
          blockedAt: new Date(),
          blockedById: 'some-id',
        },
      });

      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          blockedAt: {
            startDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const blockedAt = dayjsTZ(user.blockedAt);
        expect(blockedAt.isSameOrBefore(today, 'day')).toBe(true);
      });
    });

    it('should filter by blockedAt[startDate, endDate]', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          isBlocked: true,
          blockedAt: new Date(),
          blockedById: 'some-id',
        },
      });

      const today = dayjsTZ().format('YYYY-MM-DD');
      const res = await request(app)
        .get('/api/users')
        .query({
          blockedAt: {
            startDate: today,
            endDate: today,
          },
        });

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((user: User) => {
        const blockedAt = dayjsTZ(user.blockedAt);
        expect(blockedAt.isBetween(today, today, 'day', '[]')).toBe(true);
      });
    });

    it('should filter by blockedById', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: CONFIG.TEST_USER_PASSWORD,
          role: 'CUSTOMER',
          isBlocked: true,
          blockedAt: new Date(),
          blockedById: 'some-id',
        },
      });

      const res = await request(app).get('/api/users').query({ blockedById: 'some-id' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.blockedById === 'some-id')).toBe(true);
    });
  });
});

describe('GET /users/list', () => {
  it('should list users', async () => {
    const res = await request(app).get('/api/users/list');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  describe('Filters', () => {
    it('should filter by role', async () => {
      const res = await request(app).get('/api/users/list').query({ role: 'CUSTOMER' });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter by name', async () => {
      const name = faker.person.fullName();
      const res = await request(app).get(`/api/users/list`).query({ name });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.name.includes(name))).toBe(true);
    });

    it('should filter by email', async () => {
      const email = faker.internet.email();
      const res = await request(app).get(`/api/users/list`).query({ email });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter by isActive', async () => {
      const res = await request(app).get('/api/users/list').query({ isActive: true });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter by isBlocked', async () => {
      const res = await request(app).get('/api/users/list').query({ isBlocked: true });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter by isEmailVerified', async () => {
      const res = await request(app).get('/api/users/list').query({ isEmailVerified: true });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should filter by isPhoneVerified', async () => {
      const res = await request(app).get('/api/users/list').query({ isPhoneVerified: true });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });
});

describe('GET /users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  it('should return a user by ID', async () => {
    const user = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

    const res = await request(app).get(`/api/users/${user.body.data.data.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.id).toBe(user.body.data.data.id);
  });

  it('should return 404 if user not found', async () => {
    const res = await request(app).get(`/api/users/non-existent-id`);

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /users', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  it('should create a user successfully', async () => {
    const email = faker.internet.email();
    const name = faker.person.fullName();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name,
        email,
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.email).toBe(email);
    expect(res.body.data.data.name).toBe(name);
  });

  it('should create a user successfully with image', async () => {
    const email = faker.internet.email();
    const name = faker.person.fullName();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', name)
      .field('email', email)
      .field('password', CONFIG.TEST_USER_PASSWORD)
      .field('role', 'CUSTOMER')
      .attach('image', MOCK_IMAGE_PATH);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.email).toBe(email);
    expect(res.body.data.data.name).toBe(name);
  });

  it('should fail to create user with invalid data', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'A', // too short
        email: 'invalid-email',
        password: randomInt(0, 3), // too short
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should not allow duplicate email', async () => {
    const email = faker.internet.email();

    await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({
      name: faker.person.fullName(),
      email,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.person.fullName(),
        email, // same email
        password: CONFIG.TEST_USER_PASSWORD,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  it('should update the user successfully', async () => {
    const newName = faker.person.fullName();
    const email = faker.internet.email();
    const name = faker.person.fullName();

    const user = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name,
        email,
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

    const res = await request(app)
      .patch(`/api/users/${user.body.data.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: newName,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.name).toBe(newName);
  });

  it('should return 404 if user is not found', async () => {
    const nonExistentId = 'nonexistent-id';

    const res = await request(app)
      .patch(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Name',
      });

    expect(res.statusCode).toBe(404);
  });

  it('should update user with image', async () => {
    const email = faker.internet.email();
    const name = faker.person.fullName();

    const user = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name,
        email,
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

    const res = await request(app)
      .patch(`/api/users/${user.body.data.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', name)
      .attach('image', MOCK_IMAGE_PATH);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.name).toBe(name);
  });
});

describe('DELETE /users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  it('should delete the user successfully', async () => {
    const user = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: CONFIG.TEST_USER_PASSWORD,
        role: 'CUSTOMER',
      });

    const res = await request(app)
      .delete(`/api/users/${user.body.data.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('should return 404 if user does not exist', async () => {
    const res = await request(app)
      .delete('/api/users/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/users/export', () => {
  let adminToken: string;

  const today = dayjsTZ().format('YYYY-MM-DD');

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  it('should export users in CSV format', async () => {
    const res = await request(app)
      .get(`/api/users/export`)
      .query({
        format: 'csv',
        maxTokens: 40,
        blockedAt: {
          startDate: today,
          endDate: today,
        },
      })
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer()
      .parse(parseCsvResponse);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toContain('attachment; filename="Users.csv"');

    expect(typeof res.body).toBe('string');
    expect(res.body).toContain('#');
  });

  it('should export users in Excel format (xlsx)', async () => {
    const res = await request(app)
      .get(`/api/users/export?format=xlsx`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        role: 'CUSTOMER',
        name: 'John Doe',
        email: faker.internet.email(),
        isActive: true,
        isBlocked: true,
        createdAt: {
          startDate: today,
          endDate: today,
        },
      })
      .buffer()
      .parse(parseExcelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(res.headers['content-disposition']).toContain('attachment; filename="Users.xlsx"');

    expect(res.body).toBeInstanceOf(Buffer); // xlsx returns a buffer

    // Load the workbook from buffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);

    const worksheet = workbook.worksheets[0];

    const map: Record<string, number> = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      map[cell.text.trim()] = colNumber;
    });

    // Basic validation
    expect(worksheet).toBeDefined();

    // Confirm data rows match expected content
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const email = row.getCell(map['email'])?.text?.toLowerCase() ?? '';

      expect(email).toContain(email);
    });
  });

  it('should export users in PDF format', async () => {
    const res = await request(app)
      .get(`/api/users/export`)
      .query({
        format: 'pdf',
        failedLoginAttempts: 20,
        lastFailedLogin: {
          startDate: today,
          endDate: today,
        },
        isEmailVerified: true,
        isPhoneVerified: true,
      })
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer()
      .parse(parseCsvResponse);

    expect(res.statusCode).toBe(200);

    expect(res.body.slice(0, 4).toString()).toBe('%PDF');

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename="Users.pdf"');
    expect(Number.parseInt(res.headers['content-length'])).toBeGreaterThan(0);
  }, 20000); // 20 seconds
});
