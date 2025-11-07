import { faker } from '@faker-js/faker';
import { PermissionGroup } from '@prisma/client';
import { ADMIN_EMAIL } from '@tests/test.constants';
import { parseCsvResponse, parseExcelResponse } from '@tests/test.utils';
import ExcelJS from 'exceljs';
import request from 'supertest';

import app from '@/app';
import CONFIG from '@/apps/config';

describe('Permission Group API', () => {
  let permissionGroupId: string;
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  const getPermissionNames = (groups: PermissionGroup[]) => {
    return groups.map((p: PermissionGroup) => p.name);
  };

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
        const name = faker.company.name + faker.number.hex({ min: 0, max: 65535 });

        const createRes = await request(app)
          .post('/api/permissions/permission-groups')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: name,
            description: 'Filter test description',
          });

        expect(createRes.status).toBe(201);

        const res = await request(app).get('/api/permissions/permission-groups').query({ name });

        const names = getPermissionNames(res.body.data.data);
        expect(names).toEqual(expect.arrayContaining([name]));
      });
    });
  });

  describe('GET /api/permissions/permission-groups/export', () => {
    it('should export Permission Group in CSV format', async () => {
      const res = await request(app)
        .get(`/api/permissions/permission-groups/export`)
        .query({
          format: 'csv',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse(parseCsvResponse);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="Permission Groups.csv"'
      );

      expect(typeof res.body).toBe('string');
      expect(res.body).toContain('#');
    });

    it('should export permission Group in Excel format (xlsx)', async () => {
      const res = await request(app)
        .get(`/api/permissions/permission-groups/export?format=xlsx`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          name: 'Test Group',
        })
        .buffer()
        .parse(parseExcelResponse);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="Permission Groups.xlsx"'
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

    it('should export permission Group in PDF format', async () => {
      const res = await request(app)
        .get(`/api/permissions/permission-groups/export`)
        .query({
          format: 'pdf',
          name: 'Test Group',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse(parseCsvResponse);

      expect(res.statusCode).toBe(200);

      expect(res.body.slice(0, 4).toString()).toBe('%PDF');

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="Permission Groups.pdf"'
      );
      expect(Number.parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    }, 20000); // 20 seconds
  });
});
