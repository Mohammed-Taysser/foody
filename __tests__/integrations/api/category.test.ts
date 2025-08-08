import path from 'path';

import { faker } from '@faker-js/faker';
import { Category } from '@prisma/client';
import ExcelJS from 'exceljs';
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

    describe('Filters', () => {
      it('should filter categories by name', async () => {
        const res = await request(app).get(`/api/categories?name=Appetizers`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((category: Category) => {
          expect(category.name.toLowerCase()).toContain('appetizers');
        });
      });

      it('should filter categories by restaurantId', async () => {
        const res = await request(app).get(`/api/categories?restaurantId=${restaurantId}`);

        expect(res.statusCode).toBe(200);

        res.body.data.data.forEach((category: Category) => {
          expect(category.restaurantId).toBe(restaurantId);
        });
      });
    });
  });

  describe('GET /api/categories/list', () => {
    it('should list all categories for a restaurant', async () => {
      const res = await request(app).get(`/api/categories/list`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    describe('Filters', () => {
      it('should filter categories by name', async () => {
        const res = await request(app).get(`/api/categories/list?name=Appetizers`);

        expect(res.statusCode).toBe(200);

        expect(Array.isArray(res.body.data.data)).toBe(true);
      });

      it('should filter categories by restaurantId', async () => {
        const res = await request(app).get(`/api/categories/list?restaurantId=${restaurantId}`);

        expect(res.statusCode).toBe(200);

        expect(Array.isArray(res.body.data.data)).toBe(true);
      });
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

    it('should throw 400 if no data is provided', async () => {
      const res = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
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

  describe('GET /api/categories/export', () => {
    it('should export categories in CSV format', async () => {
      const res = await request(app)
        .get(`/api/categories/export`)
        .query({ format: 'csv', restaurantId })
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
      expect(res.headers['content-disposition']).toContain('attachment; filename="Categories.csv"');

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('#');
    });

    it('should export categories in Excel format (xlsx)', async () => {
      const res = await request(app)
        .get(`/api/categories/export?format=xlsx`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ name: faker.commerce.productName(), restaurantId })
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
        'attachment; filename="Categories.xlsx"'
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

    it('should export categories in PDF format', async () => {
      const createdCategory = await request(app)
        .post(`/api/categories`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: faker.commerce.productName(), restaurantId });

      const res = await request(app)
        .get(`/api/categories/export`)
        .query({ format: 'pdf', name: createdCategory.body.data.data.name, restaurantId })
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
      expect(res.headers['content-disposition']).toContain('attachment; filename="Categories.pdf"');
      expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    });
  });
});
