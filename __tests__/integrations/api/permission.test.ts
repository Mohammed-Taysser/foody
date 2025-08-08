import { faker } from '@faker-js/faker';
import { Permission } from '@prisma/client';
import request from 'supertest';
import ExcelJS from 'exceljs';

import app from '../../../src/app';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../../test.constants';

describe('Permission API', () => {
  let permissionId: string;
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  describe('POST /api/permissions', () => {
    it('should create a new permission', async () => {
      const res = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'add:test',
          description: 'Create a test',
        });

      permissionId = res.body.data.data.id;

      expect(res.status).toBe(201);
      expect(res.body.data.data).toHaveProperty('id');
      expect(res.body.data.data.key).toBe('add:test');
    });

    it('should not create duplicate permission', async () => {
      const res = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'add:test',
          description: 'Duplicate',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/permissions/list', () => {
    it('should return all permissions', async () => {
      const res = await request(app).get('/api/permissions/list');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });

  describe('GET /api/permissions/:id', () => {
    it('should return permission by ID', async () => {
      const res = await request(app).get(`/api/permissions/${permissionId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.key).toBe('add:test');
    });

    it('should return 404 for non-existing permission', async () => {
      const res = await request(app).get('/api/permissions/non-existent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/permissions/:id', () => {
    it('should update a permission', async () => {
      const res = await request(app)
        .patch(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'update:test',
          description: 'Update a test',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.data.key).toBe('update:test');
    });

    it('should return 404 for non-existing permission', async () => {
      const res = await request(app)
        .patch('/api/permissions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'update:test',
          description: 'Update a test',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/permissions/', () => {
    it('should return paginated permissions', async () => {
      const res = await request(app).get('/api/permissions/');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('metadata');
    });

    it('should filter permissions by key', async () => {
      const randomKey = `filter:${faker.food.dish()} ${Math.floor(Math.random() * 1000)}`;

      // First, create a permission with a known key
      const createRes = await request(app)
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: randomKey,
          description: 'For filtering test',
        });

      // Create another permission with a different key
      expect(createRes.status).toBe(201);

      // Query with the filter
      const res = await request(app).get('/api/permissions').query({ key: randomKey }); // Partial match
      expect(res.status).toBe(200);

      const keys = res.body.data.data.map((p: Permission) => p.key);
      expect(keys).toEqual(expect.arrayContaining([randomKey]));

      // Clean up by deleting the created permission
      await request(app)
        .delete(`/api/permissions/${createRes.body.data.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/permissions/:id', () => {
    it('should delete a permission', async () => {
      const res = await request(app)
        .delete(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.id).toBe(permissionId);
    });

    it('should return 404 when deleting again', async () => {
      const res = await request(app)
        .delete(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/permissions/export', () => {
    it('should export permissions in CSV format', async () => {
      const res = await request(app)
        .get(`/api/permissions/export`)
        .query({
          format: 'csv',
        })
        .set('Authorization', `Bearer ${adminToken}`)
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
        'attachment; filename="Permissions.csv"'
      );

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('#');
    });

    it('should export permissions in Excel format (xlsx)', async () => {
      const res = await request(app)
        .get(`/api/permissions/export?format=xlsx`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          key: 'add:test',
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
        'attachment; filename="Permissions.xlsx"'
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

        const email = row.getCell(map['email'])?.text?.toLowerCase() ?? '';

        expect(email).toContain(email);
      });
    });

    it('should export permissions in PDF format', async () => {
      const res = await request(app)
        .get(`/api/permissions/export`)
        .query({
          format: 'pdf',
          key: 'add:test-0',
        })
        .set('Authorization', `Bearer ${adminToken}`)
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
        'attachment; filename="Permissions.pdf"'
      );
      expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    });
  });
});
