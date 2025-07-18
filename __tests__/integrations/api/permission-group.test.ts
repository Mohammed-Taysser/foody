import { faker } from '@faker-js/faker';
import { PermissionGroup } from '@prisma/client';
import request from 'supertest';

import app from '../../../src/app';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../../test.constants';

describe('Permission Group API', () => {
  let permissionGroupId: string;
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  describe('POST /api/permissions/permission-groups', () => {
    it('should create a new permission group', async () => {
      const name = faker.book.author();
      const res = await request(app)
        .post('/api/permissions/permission-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: name,
          description: 'Test description',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.data).toHaveProperty('id');
      expect(res.body.data.data.name).toBe(name);

      permissionGroupId = res.body.data.data.id;
    });

    it('should fail if group already exists', async () => {
      await request(app)
        .post('/api/permissions/permission-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Group',
          description: 'Another description',
        });

      const res2 = await request(app)
        .post('/api/permissions/permission-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Group',
          description: 'Another description',
        });

      expect(res2.status).toBe(500);
    });
  });

  describe('GET /api/permissions/permission-groups/list', () => {
    it('should list all permission groups', async () => {
      const res = await request(app).get('/api/permissions/permission-groups/list');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/permissions/permission-groups/:id', () => {
    it('should return a permission group by ID', async () => {
      const res = await request(app).get(`/api/permissions/permission-groups/${permissionGroupId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.id).toBe(permissionGroupId);
    });

    it('should return 404 if group does not exist', async () => {
      const res = await request(app).get('/api/permissions/permission-groups/non-existing-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/permissions/permission-groups/:id', () => {
    it('should update a permission group', async () => {
      const res = await request(app)
        .patch(`/api/permissions/permission-groups/${permissionGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Group',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.data.name).toBe('Updated Group');
    });

    it('should return 404 if group does not exist', async () => {
      const res = await request(app)
        .patch('/api/permissions/permission-groups/non-existing-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Group',
          description: 'Updated description',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/permissions/permission-groups/:id', () => {
    it('should delete a permission group', async () => {
      const res = await request(app)
        .delete(`/api/permissions/permission-groups/${permissionGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.id).toBe(permissionGroupId);
    });

    it('should return 404 if already deleted', async () => {
      const res = await request(app)
        .delete(`/api/permissions/permission-groups/${permissionGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/permissions/permission-groups/', () => {
    it('should return paginated permission groups', async () => {
      const res = await request(app).get('/api/permissions/permission-groups');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('metadata');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    describe('Filters', () => {
      it('should filter by name', async () => {
        const name = faker.company.name + Math.floor(Math.random() * 1000).toFixed(0);

        const createRes = await request(app)
          .post('/api/permissions/permission-groups')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: name,
            description: 'Filter test description',
          });

        expect(createRes.status).toBe(201);

        const res = await request(app).get('/api/permissions/permission-groups').query({ name });

        const names = res.body.data.data.map((p: PermissionGroup) => p.name);
        expect(names).toEqual(expect.arrayContaining([name]));
      });
    });
  });
});
