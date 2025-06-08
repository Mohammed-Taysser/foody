import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('GET /users/me', () => {
  it('should get profile', async () => {
    const dummyEmail = faker.internet.email();

    const registerResponse = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
    });

    const accessToken = registerResponse.body.data.accessToken;

    const profileResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body.data.email).toBe(dummyEmail);
  });

  it('should fail profile if not authenticated', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/users/me', () => {
  let accessToken: string;
  let originalName: string;

  beforeAll(async () => {
    const email = faker.internet.email();
    originalName = faker.person.fullName();

    const registerRes = await request(app).post('/api/auth/register').send({
      name: originalName,
      email,
      password: '123456789',
      role: 'CUSTOMER',
    });

    accessToken = registerRes.body.data.accessToken;
  });

  it('should update user profile successfully', async () => {
    const newName = faker.person.fullName();

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: newName });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe(newName);
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
    const secondUserRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
    });

    const existingEmail = secondUserRes.body.data.user.email;

    // Try to update the first user’s email to the second user’s email
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: existingEmail });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email.*already/i);
  });
});

describe('GET /users', () => {
  it('should list users', async () => {
    const res = await request(app).get('/api/users');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data).toHaveProperty('metadata');
  });
});

describe('GET /users/list', () => {
  it('should list users', async () => {
    const res = await request(app).get('/api/users/list');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.accessToken;
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

    const res = await request(app).get(`/api/users/${user.body.data.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(user.body.data.id);
  });

  it('should return 404 if user not found', async () => {
    const res = await request(app).get(`/api/users/non-existent-id`);

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/users', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.accessToken;
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
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.name).toBe(name);
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

describe('PATCH /api/users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.accessToken;
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
      .patch(`/api/users/${user.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: newName,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe(newName);
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
});

describe('DELETE /api/users/:id', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.accessToken;
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
      .delete(`/api/users/${user.body.data.id}`)
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
