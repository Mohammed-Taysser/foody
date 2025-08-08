import path from 'path';

import { faker } from '@faker-js/faker';
import { Restaurant } from '@prisma/client';
import ExcelJS from 'exceljs';
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

    it('should filter restaurants by name', async () => {
      const restaurantName = faker.company.name();

      const createdRestaurant = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: restaurantName,
          ownerId: ownerId,
          location: faker.location.city(),
        });

      expect(createdRestaurant.statusCode).toBe(201);

      const res = await request(app).get('/api/restaurants').query({ name: restaurantName });

      expect(res.status).toBe(200);

      const names = res.body.data.data.map((p: Restaurant) => p.name);
      expect(names).toEqual(expect.arrayContaining([restaurantName]));
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

    it('should not update restaurant if owner not exist', async () => {
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
          ownerId: 'invalid-id',
          location: faker.location.city(),
        });

      expect(updateRes.statusCode).toBe(404);
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

  describe('GET /api/restaurants/export', () => {
    it('should export restaurants in CSV format', async () => {
      const res = await request(app)
        .get(`/api/restaurants/export`)
        .query({
          format: 'csv',
          name: faker.company.name(),
        })
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
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="Restaurants.csv"'
      );

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('#');
    });

    it('should export restaurants in Excel format (xlsx)', async () => {
      const res = await request(app)
        .get(`/api/restaurants/export?format=xlsx`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({
          name: faker.company.name(),
        })
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
        'attachment; filename="Restaurants.xlsx"'
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

        const name = row.getCell(map['name'])?.text?.toLowerCase() ?? '';

        expect(name).toContain(name);
      });
    });

    it('should export restaurants in PDF format', async () => {
      const res = await request(app)
        .get(`/api/restaurants/export`)
        .query({
          format: 'pdf',
          name: faker.company.name(),
        })
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
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="Restaurants.pdf"'
      );
      expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    }, 20000); // 20 seconds
  });
});
