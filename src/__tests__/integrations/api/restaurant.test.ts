import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('Restaurant API', () => {
  let ownerToken: string;
  let ownerId: string;

  beforeAll(async () => {
    // Register OWNER
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'OWNER',
    });
    ownerToken = ownerRes.body.data.accessToken;
    ownerId = ownerRes.body.data.user.id;
  });

  describe('GET /restaurants', () => {
    it('should list restaurants', async () => {
      const res = await request(app).get('/api/restaurants');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });

  describe('GET /restaurants/list', () => {
    it('should list restaurants', async () => {
      const res = await request(app).get('/api/restaurants/list');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /restaurants/:restaurantId', () => {
    it('should get a restaurant by ID', async () => {
      const createRes = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: faker.company.name(),
          ownerId,
          location: faker.location.city(),
        });

      const restaurantId = createRes.body.data.id;

      const res = await request(app).get(`/api/restaurants/${restaurantId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(restaurantId);
    });

    it('should return 404 if restaurant not found', async () => {
      const res = await request(app).get('/api/restaurants/non-existing-id');

      expect(res.statusCode).toBe(404);
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

  describe('PATCH /restaurants/:restaurantId', () => {
    it('should update a restaurant by ID', async () => {
      const createRes = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: faker.company.name(),
          ownerId,
          location: faker.location.city(),
        });

      const restaurantId = createRes.body.data.id;

      const updateRes = await request(app)
        .patch(`/api/restaurants/${restaurantId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: faker.company.name(),
          ownerId,
          location: faker.location.city(),
        });

      expect(updateRes.statusCode).toBe(200);
    });

    it('should return 404 if restaurant does not exist on update', async () => {
      const res = await request(app)
        .patch('/api/restaurants/non-existing-id')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Will Fail' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /restaurants/:restaurantId', () => {
    it('should delete a restaurant by ID', async () => {
      const createRes = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: faker.company.name(),
          ownerId,
          location: faker.location.city(),
        });

      const restaurantId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/restaurants/${restaurantId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteRes.statusCode).toBe(200);
    });

    it('should return 404 when deleting non-existing restaurant', async () => {
      const res = await request(app)
        .delete('/api/restaurants/non-existing-id')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
