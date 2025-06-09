import { faker } from '@faker-js/faker';
import request from 'supertest';

import app from '@/app';

describe('Permission Group API', () => {
  let permissionGroupId: string;
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: '123456789',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.accessToken;
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
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(name);

      permissionGroupId = res.body.data.id;
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
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/permissions/permission-groups/:id', () => {
    it('should return a permission group by ID', async () => {
      const res = await request(app).get(`/api/permissions/permission-groups/${permissionGroupId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(permissionGroupId);
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
      expect(res.body.data.name).toBe('Updated Group');
    });
  });

  describe('DELETE /api/permissions/permission-groups/:id', () => {
    it('should delete a permission group', async () => {
      const res = await request(app)
        .delete(`/api/permissions/permission-groups/${permissionGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(permissionGroupId);
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
  });
});
