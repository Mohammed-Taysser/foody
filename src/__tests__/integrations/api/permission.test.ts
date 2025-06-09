import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('Permission API', () => {
  let permissionId: string;
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
    });
    adminToken = adminRes.body.data.accessToken;
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

      permissionId = res.body.data.id;

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.key).toBe('add:test');
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
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/permissions/:id', () => {
    it('should return permission by ID', async () => {
      const res = await request(app).get(`/api/permissions/${permissionId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.key).toBe('add:test');
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
      expect(res.body.data.key).toBe('update:test');
    });
  });

  describe('GET /api/permissions/', () => {
    it('should return paginated permissions', async () => {
      const res = await request(app).get('/api/permissions/');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('metadata');
    });
  });

  describe('DELETE /api/permissions/:id', () => {
    it('should delete a permission', async () => {
      const res = await request(app)
        .delete(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(permissionId);
    });

    it('should return 404 when deleting again', async () => {
      const res = await request(app)
        .delete(`/api/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
