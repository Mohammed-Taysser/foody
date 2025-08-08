import path from 'path';

import { faker } from '@faker-js/faker';
import { MenuItem } from '@prisma/client';
import request from 'supertest';
import ExcelJS from 'exceljs';

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
const mockFontPath = path.join(__dirname, '../../../public/DINNextLTArabic.ttf');

describe('Menu Items API', () => {
  let ownerToken: string;
  let ownerId: string;
  let restaurantId: string;

  let adminToken: string;
  let menuItemId: string;
  let categoryId: string;

  beforeAll(async () => {
    // Register an OWNER
    const ownerRes = await request(app).post('/api/auth/login').send({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    });

    ownerToken = ownerRes.body.data.data.accessToken;
    ownerId = ownerRes.body.data.data.user.id;

    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;

    // Create a restaurant
    const restaurantRes = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.company.name(),
        location: faker.location.city(),
        ownerId,
      });

    restaurantId = restaurantRes.body.data.data.id;

    // Create a category
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pizza',
        restaurantId,
      });

    categoryId = categoryRes.body.data.data.id;

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
      expect(res.body.data.data.name).toBe('Pizza Margherita');
      menuItemId = res.body.data.data.id;
    });

    it("should forbid adding menu item to someone else's restaurant", async () => {
      const otherOwnerRes = await request(app).post('/api/auth/login').send({
        email: OWNER_2_EMAIL,
        password: OWNER_2_PASSWORD,
      });

      const token = otherOwnerRes.body.data.data.accessToken;

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

    it('should allow uploading image when adding a menu item', async () => {
      const res = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Pizza Upload')
        .field('price', 15.99)
        .field('available', true)
        .field('restaurantId', restaurantId)
        .field('categoryId', categoryId)
        .attach('image', mockImagePath);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.image).toMatch(/\/uploads\/menu\//);
    });

    it('should not allow uploading non-image file when adding a menu item', async () => {
      const res = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Pizza Upload')
        .field('price', 15.99)
        .field('available', true)
        .field('restaurantId', restaurantId)
        .field('categoryId', categoryId)
        .attach('image', mockFontPath);

      expect(res.statusCode).toBe(400);
    });

    it('should return 401 if unauthenticated user tries to create a menu item', async () => {
      const res = await request(app).post(`/api/menu-items`).send({
        name: 'Unauthorized Dish',
        price: 10,
        restaurantId,
        categoryId,
      });

      expect(res.statusCode).toBe(401);
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

    describe('Filters', () => {
      it('should filter by name', async () => {
        const res = await request(app).get(`/api/menu-items?name=Pizza`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((item: MenuItem) => {
          expect(item.name.toLowerCase()).toContain('pizza');
        });
      });

      it('should filter by restaurantId', async () => {
        const res = await request(app).get(`/api/menu-items?restaurantId=${restaurantId}`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((item: MenuItem) => {
          expect(item.restaurantId).toBe(restaurantId);
        });
      });

      it('should filter by available status=true', async () => {
        const res = await request(app).get(`/api/menu-items?available=true`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((item: MenuItem) => {
          expect(item.available).toBe(true);
        });
      });

      it('should filter by available status=false', async () => {
        const res = await request(app).get(`/api/menu-items?available=false`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((item: MenuItem) => {
          expect(item.available).toBe(false);
        });
      });
    });
  });

  describe('Get /api/menu-items/list', () => {
    it('should fetch all menu items', async () => {
      const res = await request(app).get(`/api/menu-items/list`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    describe('Filters', () => {
      it('should filter by name', async () => {
        const res = await request(app).get(`/api/menu-items/list?name=Pizza`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((item: MenuItem) => {
          expect(item.name.toLowerCase()).toContain('pizza');
        });
      });

      it('should filter by restaurantId', async () => {
        const res = await request(app).get(`/api/menu-items/list?restaurantId=${restaurantId}`);

        expect(res.statusCode).toBe(200);

        expect(Array.isArray(res.body.data.data)).toBe(true);
      });

      it('should filter by available status=true', async () => {
        const res = await request(app).get(`/api/menu-items/list?available=true`);

        expect(res.statusCode).toBe(200);

        expect(Array.isArray(res.body.data.data)).toBe(true);
      });

      it('should filter by available status=false', async () => {
        const res = await request(app).get(`/api/menu-items/list?available=false`);

        expect(res.statusCode).toBe(200);

        expect(Array.isArray(res.body.data.data)).toBe(true);
      });
    });
  });

  describe('GET /api/menu-items/:itemId', () => {
    it('should fetch a specific menu item', async () => {
      const res = await request(app).get(`/api/menu-items/${menuItemId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.data.id).toBe(menuItemId);
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

  describe('GET /api/menu-items/export', () => {
    it('should export menu-items in CSV format', async () => {
      const res = await request(app)
        .get(`/api/menu-items/export?format=csv`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .buffer()
        .parse((res, callback) => {
          const chunks: Uint8Array<ArrayBufferLike>[] = [];
          res.setEncoding('utf8');
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, chunks.join('')));
        });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(res.headers['content-disposition']).toContain('attachment; filename="Menu Items.csv"');

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('#');
    });

    it('should export menu-items in Excel format (xlsx)', async () => {
      const res = await request(app)
        .get(`/api/menu-items/export?format=xlsx`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ restaurantId })
        .buffer()
        .parse((res, callback) => {
          const chunks: Uint8Array<ArrayBufferLike>[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="Menu Items.xlsx"'
      );

      expect(res.body).toBeInstanceOf(Buffer); // xlsx returns a buffer

      // Load the workbook from buffer
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(res.body);

      const worksheet = workbook.worksheets[0];

      const map: Record<string, number> = {};
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        map[cell.text.trim()] = colNumber;
      });

      // Basic validation
      expect(worksheet).toBeDefined();

      // Confirm data rows match expected content
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const restaurantId = row.getCell(map['restaurantId'])?.text?.toLowerCase() ?? '';

        expect(restaurantId).toContain(restaurantId);
      });
    });

    it('should export menu-items in PDF format', async () => {
      const createdItem = await request(app)
        .get(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      const res = await request(app)
        .get(`/api/menu-items/export`)
        .query({ format: 'pdf', name: createdItem.body.data.data.name, available: false })
        .set('Authorization', `Bearer ${ownerToken}`)
        .buffer()
        .parse((res, callback) => {
          const chunks: Uint8Array<ArrayBufferLike>[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.statusCode).toBe(200);

      expect(res.body.slice(0, 4).toString()).toBe('%PDF');

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="Menu Items.pdf"');
      expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    }, 20000); // 20 seconds
  });

  describe('PATCH /api/menu/:itemId', () => {
    it('should allow owner to update a menu item', async () => {
      const res = await request(app)
        .patch(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ price: 12.99 });

      expect(res.statusCode).toBe(200);
      expect(parseFloat(res.body.data.data.price)).toBe(12.99);
    });

    it('should return 404 when updating with non-existent restaurantId', async () => {
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
      const otherOwner = await request(app).post('/api/auth/login').send({
        email: OWNER_2_EMAIL,
        password: OWNER_2_PASSWORD,
      });

      const token = otherOwner.body.data.data.accessToken;

      const res = await request(app)
        .patch(`/api/menu-items/${menuItemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 20 });

      expect(res.statusCode).toBe(403);
    });

    it('should replace image when updating a menu item', async () => {
      // First, create item with initial image
      const createRes = await request(app)
        .post(`/api/menu-items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .field('name', 'Image Replace')
        .field('price', 18.99)
        .field('available', true)
        .field('restaurantId', restaurantId)
        .field('categoryId', categoryId)
        .attach('image', mockImagePath);

      const itemId = createRes.body.data.data.id;

      // Then, update with a new image
      const updateRes = await request(app)
        .patch(`/api/menu-items/${itemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('image', mockImagePath);

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.data.image).toMatch(/\/uploads\/menu\//);
    });

    it('should return 401 if unauthenticated user tries to update a menu item', async () => {
      const res = await request(app).patch(`/api/menu-items/${menuItemId}`).send({ price: 999 });

      expect(res.statusCode).toBe(401);
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
      const otherOwner = await request(app).post('/api/auth/login').send({
        email: OWNER_2_EMAIL,
        password: OWNER_2_PASSWORD,
      });

      const token = otherOwner.body.data.data.accessToken;

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

      const res = await request(app)
        .delete(`/api/menu-items/${menuItemToDelete.body.data.data.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 401 if unauthenticated user tries to delete a menu item', async () => {
      const res = await request(app).delete(`/api/menu-items/${menuItemId}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
