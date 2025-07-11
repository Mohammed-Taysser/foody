import path from 'path';

import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '../../../src/app';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  OWNER_2_EMAIL,
  OWNER_2_PASSWORD,
  OWNER_EMAIL,
  OWNER_PASSWORD,
} from '../../test.constants';

const mockImagePath = path.join(__dirname, '../../../public/avatar.jpg');

describe('Category API', () => {
  let ownerToken: string;
  let adminToken: string;
  let restaurantId: string;
  let categoryId: string;

  beforeAll(async () => {
    const ownerRes = await request(app).post('/api/auth/login').send({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });
    ownerToken = ownerRes.body.data.data.accessToken;
    const ownerId = ownerRes.body.data.data.user.id;

    // Create restaurant
    const restaurantRes = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        location: faker.location.city(),
        ownerId,
      });

    restaurantId = restaurantRes.body.data.data.id;

    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;

    // Seed 10 categories for pagination & filtering test
    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        request(app).post(`/api/categories`).set('Authorization', `Bearer ${ownerToken}`).send({
          name: faker.food.ethnicCategory(),
          restaurantId,
        })
      )
    );
  });

  describe('POST /api/categories', () => {
    it('should allow owner to create a category', async () => {
      const res = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Appetizers', restaurantId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.name).toBe('Appetizers');
      categoryId = res.body.data.data.id;
    });

    it('should forbid another owner from creating a category', async () => {
      const otherOwner = await request(app).post('/api/auth/login').send({
        email: OWNER_2_EMAIL,
        password: OWNER_2_PASSWORD,
      });

      const res = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${otherOwner.body.data.data.accessToken}`)
        .send({ name: 'Unauthorized', restaurantId });

      expect(res.statusCode).toBe(403);
    });

    it("should't create category if restaurant does not exist", async () => {
      const unExistingId = faker.string.uuid();

      const res = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Unauthorized', restaurantId: unExistingId });

      expect(res.statusCode).toBe(409);
    });

    it('should return paginated results with limit and page', async () => {
      const res = await request(app)
        .get(`/api/categories?page=2&limit=5`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
      expect(res.body.data).toHaveProperty('metadata');
      expect(res.body.data.metadata.page).toBe(2);
      expect(res.body.data.metadata.limit).toBe(5);
    });

    it('should allow uploading image when adding a category', async () => {
      const res = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Pizza Upload')
        .field('restaurantId', restaurantId)
        .attach('image', mockImagePath);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.image).toMatch(/\/uploads\/category\//);
    });
  });

  describe('GET /api/categories/:categoryId', () => {
    it('should return a category by ID', async () => {
      // recreate category
      const resCreate = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Drinks', restaurantId });

      categoryId = resCreate.body.data.data.id;

      const res = await request(app).get(`/api/categories/${categoryId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.name).toBe('Drinks');
    });

    it('should return 404 if category does not exist', async () => {
      const res = await request(app).get(`/api/categories/${faker.string.uuid()}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/categories', () => {
    it('should list all categories for a restaurant', async () => {
      const res = await request(app).get(`/api/categories`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data).toHaveProperty('metadata');
    });
  });

  describe('GET /api/categories/list', () => {
    it('should list all categories for a restaurant', async () => {
      const res = await request(app).get(`/api/categories/list`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });

  describe('PATCH /api/categories/:categoryId', () => {
    it('should allow admin to update a category', async () => {
      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Category', restaurantId });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.name).toBe('Updated Category');
    });

    it('should forbid another owner from updating category', async () => {
      const otherOwner = await request(app).post('/api/auth/login').send({
        email: OWNER_2_EMAIL,
        password: OWNER_2_PASSWORD,
      });

      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${otherOwner.body.data.data.accessToken}`)
        .send({ name: 'Hack Attempt', restaurantId });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 if category does not exist', async () => {
      const res = await request(app)
        .patch(`/api/categories/${faker.string.uuid()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nonexistent Category', restaurantId });

      expect(res.statusCode).toBe(404);
    });

    it('should return 409 if restaurant does not exist', async () => {
      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad Update', restaurantId: faker.string.uuid() });

      expect(res.statusCode).toBe(409);
    });

    it('should replace image when updating a category', async () => {
      // First, create item with initial image
      const createRes = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Image Replace')
        .field('restaurantId', restaurantId)
        .attach('image', mockImagePath);

      const categoryId = createRes.body.data.data.id;

      // Then, update with a new image
      const updateRes = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('restaurantId', restaurantId)
        .attach('image', mockImagePath);

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.data.image).toMatch(/\/uploads\/category\//);
    });
  });

  describe('DELETE /api/categories/:categoryId', () => {
    it('should forbid owner who does not own the restaurant', async () => {
      const anotherOwner = await request(app).post('/api/auth/login').send({
        email: OWNER_2_EMAIL,
        password: OWNER_2_PASSWORD,
      });

      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${anotherOwner.body.data.data.accessToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to delete a category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.id).toBe(categoryId);
    });

    it('should return 404 if category does not exist', async () => {
      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
