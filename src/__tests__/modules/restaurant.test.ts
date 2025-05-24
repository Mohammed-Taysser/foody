import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('GET /restaurants', () => {
  it('should list restaurants', async () => {
    const res = await request(app).get('/api/restaurants');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /restaurants', () => {
  let ownerToken: string;
  let ownerId: string;

  let customerId: string;
  let customerToken: string;

  beforeAll(async () => {
    const dummyEmail = faker.internet.email();

    const ownerResponse = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: dummyEmail,
      password: '123456789',
      role: 'OWNER',
    });

    const customerResponse = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'CUSTOMER',
    });

    customerToken = customerResponse.body.data.accessToken;
    customerId = customerResponse.body.data.user.id;

    ownerToken = ownerResponse.body.data.accessToken;
    ownerId = ownerResponse.body.data.user.id;
  });

  it('should create a new restaurant', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        ownerId: ownerId,
        location: faker.location.city(),
      });

    expect(res.statusCode).toBe(201);
  });

  it('should not create a new restaurant if not authenticated', async () => {
    const res = await request(app).post('/api/restaurants').send({});

    expect(res.statusCode).toBe(401);
  });

  it('should throw BadRequestError if user is not an owner', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: faker.company.name(),
        ownerId: customerId,
        location: faker.location.city(),
      });

    expect(res.statusCode).toBe(403);
  });

  it('should not create a new restaurant if name is empty', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: '',
        ownerId: ownerId,
        location: faker.location.city(),
      });

    expect(res.statusCode).toBe(400);
  });

  it('should not create a new restaurant if location is empty', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        ownerId: ownerId,
        location: '',
      });

    expect(res.statusCode).toBe(400);
  });

  it('should throw BadRequestError if ownerId is not provided', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        ownerId: '',
        location: faker.location.city(),
      });

    expect(res.statusCode).toBe(400);
  });

  it('should throw NotFoundError if owner is not found', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        ownerId: 'invalid-id',
        location: faker.location.city(),
      });

    expect(res.statusCode).toBe(404);
  });

  it('should create a new restaurant if address is empty', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        address: '',
        ownerId: ownerId,
        location: faker.location.city(),
      });

    expect(res.statusCode).toBe(201);
  });
});
