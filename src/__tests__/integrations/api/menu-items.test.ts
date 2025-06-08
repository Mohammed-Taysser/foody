import { faker } from '@faker-js/faker';
import { MenuItem } from '@prisma/client';
import request from 'supertest';

import app from '@/app';

describe('Menu Items API', () => {
  let ownerToken: string;
  let ownerId: string;
  let restaurantId: string;

  let adminToken: string;
  let menuItemId: string;
  let categoryId: string;

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

    // Create a category
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pizza',
        restaurantId,
      });

    categoryId = categoryRes.body.data.id;

    // Seed 10 menu items for pagination & filtering test
    Promise.all(
      Array.from({ length: 10 }, async () => {
        await request(app)
          .post(`/api/menu-items`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'Pizza Margherita',
            price: 10.99,
            available: true,
            restaurantId,
            categoryId,
          });
      })
    );
  });

  describe('POST /api/menu-items', () => {
    it('should allow owner to add a menu item', async () => {
      const res = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Pizza Margherita',
          price: 10.99,
          available: true,
          restaurantId,
          categoryId,
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
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Dish',
          price: 12.99,
          available: true,
          restaurantId,
          categoryId,
        });

      expect(res.statusCode).toBe(403);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Incomplete Item',
          // price is missing
          available: true,
          restaurantId,
          categoryId,
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 409 if restaurant does not exist when creating menu item', async () => {
      const res = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Ghost Dish',
          price: 9.99,
          available: true,
          restaurantId: 'non-existent-id',
          categoryId,
        });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /api/menu-items', () => {
    it('should fetch menu items with pagination', async () => {
      const res = await request(app).get(`/api/menu-items?page=1&limit=5`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data).toHaveProperty('metadata');
    });

    it('should filter available items', async () => {
      const res = await request(app).get(`/api/menu-items?available=true`);

      expect(res.statusCode).toBe(200);

      res.body.data.data.forEach((item: MenuItem) => {
        expect(item.available).toBe(true);
      });
    });

    it('should filter menu items by restaurantId', async () => {
      const res = await request(app).get(`/api/menu-items?restaurantId=${restaurantId}`);

      expect(res.statusCode).toBe(200);
      res.body.data.data.forEach((item: MenuItem) => {
        expect(item.restaurantId).toBe(restaurantId);
      });
    });

    it('should return paginated results (default limit 10)', async () => {
      const res = await request(app).get(`/api/menu-items`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(10);
      expect(res.body.data.metadata).toHaveProperty('total');
      expect(res.body.data.metadata).toHaveProperty('limit', 10);
      expect(res.body.data.metadata).toHaveProperty('page', 1);
    });

    it('should return page 2 of menu items', async () => {
      const res = await request(app).get(`/api/menu-items?page=2`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(10);
      expect(res.body.data.metadata.page).toBe(2);
    });

    it('should respect custom limit', async () => {
      const res = await request(app).get(`/api/menu-items?page=1&limit=5`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
      expect(res.body.data.metadata.limit).toBe(5);
    });

    it('should return empty data when page is too high', async () => {
      const res = await request(app).get(`/api/menu-items?page=999`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.length).toBe(0);
    });
  });

  describe('GET /api/menu-items/:itemId', () => {
    it('should fetch a specific menu item', async () => {
      const res = await request(app).get(`/api/menu-items/${menuItemId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(menuItemId);
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = 'non-existent-id';
      const res = await request(app).get(`/api/menu-items/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid menu item id format', async () => {
      const res = await request(app).get(`/api/menu-items/!@#`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Get /api/menu-items/list', () => {
    it('should fetch all menu items', async () => {
      const res = await request(app).get(`/api/menu-items/list`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/menu/:itemId', () => {
    it('should allow owner to update a menu item', async () => {
      const res = await request(app)
        .patch(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ price: 12.99 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.price).toBe(12.99);
    });

    it('should return 409 when updating with non-existent restaurantId', async () => {
      const res = await request(app)
        .patch(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ price: 15.99, restaurantId: 'non-existent-id' });

      expect(res.statusCode).toBe(409);
    });

    it('should return 404 when updating non-existent menu item', async () => {
      const res = await request(app)
        .patch(`/api/menu-items/non-existent-id`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ price: 15.99 });

      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if another owner tries to update the menu item', async () => {
      const otherOwner = await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'OWNER',
      });

      const token = otherOwner.body.data.accessToken;

      const res = await request(app)
        .patch(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 20 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/menu-items/:itemId', () => {
    it('should allow admin to delete a menu item', async () => {
      const res = await request(app)
        .delete(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Menu item deleted');
    });

    it('should return 404 for deleted or non-existent item', async () => {
      const res = await request(app)
        .delete(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if another owner tries to delete the menu item', async () => {
      const otherOwner = await request(app).post('/api/auth/register').send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'OWNER',
      });

      const menuItemToDelete = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Pizza Margherita',
          price: 10.99,
          available: true,
          restaurantId,
          categoryId,
        });

      const token = otherOwner.body.data.accessToken;

      const res = await request(app)
        .delete(`/api/menu-items/${menuItemToDelete.body.data.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
