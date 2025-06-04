import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('Category API', () => {
  let ownerToken: string;
  let adminToken: string;
  let restaurantId: string;
  let categoryId: string;

  beforeAll(async () => {
    // Register OWNER
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'OWNER',
    });
    ownerToken = ownerRes.body.data.accessToken;
    const ownerId = ownerRes.body.data.user.id;

    // Create restaurant
    const restaurantRes = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        location: faker.location.city(),
        ownerId,
      });
    restaurantId = restaurantRes.body.data.id;

    // Register ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.accessToken;
  });

  describe('POST /api/restaurants/:id/categories', () => {
    it('should allow owner to create a category', async () => {
      const res = await request(app)
        .post(`/api/restaurants/${restaurantId}/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Appetizers' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Appetizers');
      categoryId = res.body.data.id;
    });

    it('should forbid another owner from creating a category', async () => {
      const otherOwner = await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'OWNER',
      });

      const res = await request(app)
        .post(`/api/restaurants/${restaurantId}/categories`)
        .set('Authorization', `Bearer ${otherOwner.body.data.accessToken}`)
        .send({ name: 'Unauthorized' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/restaurants/:id/categories', () => {
    it('should list all categories for a restaurant', async () => {
      const res = await request(app).get(`/api/restaurants/${restaurantId}/categories`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('items');
    });
  });

  describe('PATCH /api/restaurants/:id/categories/:categoryId', () => {
    it('should allow admin to update a category', async () => {
      const res = await request(app)
        .patch(`/api/restaurants/${restaurantId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Category' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Updated Category');
    });

    it('should forbid another owner from updating category', async () => {
      const otherOwner = await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'OWNER',
      });

      const res = await request(app)
        .patch(`/api/restaurants/${restaurantId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${otherOwner.body.data.accessToken}`)
        .send({ name: 'Hack Attempt' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/restaurants/:id/categories/:categoryId', () => {
    it('should allow admin to delete a category', async () => {
      const res = await request(app)
        .delete(`/api/restaurants/${restaurantId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Category deleted');
    });

    it('should return 404 if category does not exist', async () => {
      const res = await request(app)
        .delete(`/api/restaurants/${restaurantId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
