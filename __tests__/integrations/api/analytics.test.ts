import { OrderStatus } from '@prisma/client';
import { ADMIN_EMAIL } from '@tests/test.constants';
import request from 'supertest';

import app from '@/app';
import CONFIG from '@/apps/config';

describe('Dashboard Analytics', () => {
  let adminToken: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/api/auth/login').send({
      email: ADMIN_EMAIL,
      password: CONFIG.TEST_USER_PASSWORD,
    });

    adminToken = adminRes.body.data.data.accessToken;
  });

  it('/analytics', async () => {
    const res = await request(app).get('/api/analytics');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toHaveProperty('totals');
    expect(res.body.data.data).toHaveProperty('thisWeek');
    expect(res.body.data.data).toHaveProperty('lastWeek');
    expect(res.body.data.data).toHaveProperty('growth');

    const sections = ['users', 'restaurants', 'categories', 'menuItems', 'orders'];

    for (const section of sections) {
      expect(res.body.data.data.totals).toHaveProperty(section);
      expect(res.body.data.data.thisWeek).toHaveProperty(section);
      expect(res.body.data.data.lastWeek).toHaveProperty(section);
      expect(res.body.data.data.growth).toHaveProperty(section);
    }
  });

  describe('/analytics/orders/per-day', () => {
    it('should return order stats for the past 7 days', async () => {
      const res = await request(app)
        .get('/api/analytics/orders/per-day')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBe(7);

      const expectedStatuses = ['PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED'];
      for (const day of res.body.data.data) {
        expect(day).toHaveProperty('date');
        expect(typeof day.date).toBe('string');
        for (const status of expectedStatuses) {
          expect(day).toHaveProperty(status);
          expect(typeof day[status as OrderStatus]).toBe('number');
        }
      }
    });
  });
});
