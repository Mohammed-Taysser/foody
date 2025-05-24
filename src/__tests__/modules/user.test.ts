import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

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
});
