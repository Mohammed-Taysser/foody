import path from 'path';

import { faker } from '@faker-js/faker';
import request from 'supertest';
import { User } from '@prisma/client';

import app from '../../../src/app';
import prisma from '../../../src/apps/prisma';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  CUSTOMER_EMAIL,
  CUSTOMER_PASSWORD,
  OWNER_EMAIL,
  OWNER_PASSWORD,
} from '../../test.constants';

const mockImagePath = path.join(__dirname, '../../../public/avatar.jpg');

describe('GET /users/me', () => {
  it('should get profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
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
      password: CUSTOMER_PASSWORD,
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
      password: OWNER_PASSWORD,
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
      password: CUSTOMER_PASSWORD,
    });

    const existingEmail = secondUserRes.body.data.data.user.email;

    // Try to update the first user’s email to the second user’s email
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: existingEmail });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email.*already/i);
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
      .attach('image', mockImagePath);

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
      const attempts = Math.ceil(Math.random() * 5); // Random number between 1 and 5
      const res = await request(app).get('/api/users').query({ failedLoginAttempts: attempts });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.every((user: User) => user.failedLoginAttempts === attempts)).toBe(
        true
      );
    });

    it('should filter by lastFailedLogin', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: '123456789',
          role: 'CUSTOMER',
          lastFailedLogin: new Date(), // Set lastFailedLogin to today
          failedLoginAttempts: 1,
        },
      });

      // Assuming the lastFailedLogin is set to today for the test user
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app).get('/api/users').query({ lastFailedLogin: today });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.data.every((user: User) => {
          if (!user.lastFailedLogin) {
            return false;
          }

          return new Date(user.lastFailedLogin).toISOString().slice(0, 10) === today;
        })
      ).toBe(true);
    });

    it('should filter by createdAt', async () => {
      await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'CUSTOMER',
      });

      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app).get('/api/users').query({ createdAt: today });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.data.every((user: User) => {
          return new Date(user.createdAt).toISOString().slice(0, 10) === today;
        })
      ).toBe(true);
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

    it('should filter by blockedAt', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: '123456789',
          role: 'CUSTOMER',
          isBlocked: true,
          blockedAt: new Date(),
          blockedById: 'some-id',
        },
      });

      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app).get('/api/users').query({ blockedAt: today });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.data.every((user: User) => {
          if (!user.blockedAt) {
            return false;
          }

          return new Date(user.blockedAt).toISOString().slice(0, 10) === today;
        })
      ).toBe(true);
    });

    it('should filter by blockedById', async () => {
      await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: '123456789',
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
      password: ADMIN_PASSWORD,
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
        password: '123456789',
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
      password: ADMIN_PASSWORD,
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
        password: '123456789',
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
      .field('password', '123456789')
      .field('role', 'CUSTOMER')
      .attach('image', mockImagePath);

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
        password: '123', // too short
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should not allow duplicate email', async () => {
    const email = faker.internet.email();

    await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({
      name: faker.person.fullName(),
      email,
      password: '123456789',
    });

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.person.fullName(),
        email, // same email
        password: '123456789',
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
      password: ADMIN_PASSWORD,
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
        password: '123456789',
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
        password: '123456789',
        role: 'CUSTOMER',
      });

    const res = await request(app)
      .patch(`/api/users/${user.body.data.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', name)
      .attach('image', mockImagePath);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.data.name).toBe(name);
  });
});

describe('DELETE /users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
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
        password: '123456789',
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
