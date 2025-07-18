import { faker } from '@faker-js/faker';
import { Permission } from '@prisma/client';
import request from 'supertest';

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
});
