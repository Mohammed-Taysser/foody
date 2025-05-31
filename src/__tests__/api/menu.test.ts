import { faker } from '@faker-js/faker';
import { MenuItem } from '@prisma/client';
import request from 'supertest';

import app from '@/app';

describe('Menu API', () => {
  let ownerToken: string;
  let ownerId: string;
  let restaurantId: string;

  let adminToken: string;
  let menuItemId: string;

  beforeAll(async () => {
    // Register an OWNER
    const ownerRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'OWNER',
    });
    ownerToken = ownerRes.body.data.accessToken;
    ownerId = ownerRes.body.data.user.id;

    // Create a restaurant
    const restaurantRes = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: faker.company.name(),
        location: faker.location.city(),
        ownerId,
      });

    restaurantId = restaurantRes.body.data.id;

    // Register an ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.accessToken;
  });

  describe('POST /api/restaurants/:id/menu', () => {
    it('should allow owner to add a menu item', async () => {
      const res = await request(app)
        .post(`/api/restaurants/${restaurantId}/menu`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Pizza Margherita',
          price: 10.99,
          available: true,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Pizza Margherita');
      menuItemId = res.body.data.id;
    });

    it("should forbid adding menu item to someone else's restaurant", async () => {
      const otherOwnerRes = await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'OWNER',
      });

      const token = otherOwnerRes.body.data.accessToken;

      const res = await request(app)
        .post(`/api/restaurants/${restaurantId}/menu`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Dish',
          price: 12.99,
          available: true,
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/restaurants/:id/menu', () => {
    it('should fetch menu items with pagination', async () => {
      const res = await request(app).get(`/api/restaurants/${restaurantId}/menu?page=1&limit=5`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.metadata).toHaveProperty('total');
    });

    it('should filter available items', async () => {
      const res = await request(app).get(`/api/restaurants/${restaurantId}/menu?available=true`);

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((item: MenuItem) => {
        expect(item.available).toBe(true);
      });
    });
  });

  describe('PATCH /api/restaurants/:id/menu/:itemId', () => {
    it('should allow owner to update a menu item', async () => {
      const res = await request(app)
        .patch(`/api/restaurants/${restaurantId}/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ price: 12.99 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.price).toBe(12.99);
    });
  });

  describe('DELETE /api/restaurants/:id/menu/:itemId', () => {
    it('should allow admin to delete a menu item', async () => {
      const res = await request(app)
        .delete(`/api/restaurants/${restaurantId}/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Menu item deleted');
    });

    it('should return 404 for deleted or non-existent item', async () => {
      const res = await request(app)
        .delete(`/api/restaurants/${restaurantId}/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
