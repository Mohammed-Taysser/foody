import path from 'path';

import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../src/app';
import {
  CUSTOMER_EMAIL,
  CUSTOMER_PASSWORD,
  OWNER_EMAIL,
  OWNER_PASSWORD,
} from '../../test.constants';

const mockImagePath = path.join(__dirname, '../../../public/avatar.jpg');

describe('Restaurant API', () => {
  let ownerToken: string;
  let ownerId: string;

  let customerToken: string;
  let customerId: string;

  beforeAll(async () => {
    const ownerRes = await request(app).post('/api/auth/login').send({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
    ownerToken = ownerRes.body.data.data.accessToken;
    ownerId = ownerRes.body.data.data.user.id;

    const customerRes = await request(app).post('/api/auth/login').send({
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
    });
    customerToken = customerRes.body.data.data.accessToken;
    customerId = customerRes.body.data.data.user.id;
  });

  describe('GET /restaurants', () => {
    it('should list restaurants', async () => {
      const res = await request(app).get('/api/restaurants');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should paginate restaurants with query params', async () => {
      const res = await request(app).get('/api/restaurants?page=1&limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.metadata).toHaveProperty('page');
      expect(res.body.data.metadata).toHaveProperty('limit');
    });
  });

  describe('GET /restaurants/list', () => {
    it('should list restaurants', async () => {
      const res = await request(app).get('/api/restaurants/list');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
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

      const restaurantId = createRes.body.data.data.id;

      const res = await request(app).get(`/api/restaurants/${restaurantId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.id).toBe(restaurantId);
    });

    it('should return 404 if restaurant not found', async () => {
      const res = await request(app).get('/api/restaurants/non-existing-id');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /restaurants', () => {
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

    it('should allow uploading an image when creating a restaurant', async () => {
      const res = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', faker.company.name())
        .field('ownerId', ownerId)
        .field('location', faker.location.city())
        .attach('image', mockImagePath);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.data.image).toMatch(/restaurant/);
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

      const restaurantId = createRes.body.data.data.id;

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

    it('should update restaurant image when new file is uploaded', async () => {
      const createRes = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', faker.company.name())
        .field('ownerId', ownerId)
        .field('location', faker.location.city())
        .attach('image', mockImagePath);

      const restaurantId = createRes.body.data.data.id;

      const updateRes = await request(app)
        .patch(`/api/restaurants/${restaurantId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', faker.company.name())
        .attach('image', mockImagePath);

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.data.image).toMatch(/restaurant/);
    });

    it('should return 401 if update attempted without auth', async () => {
      const res = await request(app)
        .patch('/api/restaurants/some-id')
        .send({ name: 'Unauthorized update' });

      expect(res.statusCode).toBe(401);
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

      const restaurantId = createRes.body.data.data.id;

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

    it('should return 401 if delete attempted without auth', async () => {
      const res = await request(app).delete('/api/restaurants/some-id');

      expect(res.statusCode).toBe(401);
    });
  });
});
