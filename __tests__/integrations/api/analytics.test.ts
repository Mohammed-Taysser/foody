import { faker } from '@faker-js/faker';
import { OrderStatus } from '@prisma/client';
import request from 'supertest';

import app from '../../../src/app';

describe('Dashboard Analytics', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Register ADMIN
    const adminRes = await request(app).post('/api/auth/register').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '123456789',
      role: 'ADMIN',
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

    sections.forEach((section) => {
      expect(res.body.data.data.totals).toHaveProperty(section);
      expect(res.body.data.data.thisWeek).toHaveProperty(section);
      expect(res.body.data.data.lastWeek).toHaveProperty(section);
      expect(res.body.data.data.growth).toHaveProperty(section);
    });
  });

  describe('/analytics/orders/per-day', () => {
    it('should return order stats for the past 7 days', async () => {
      const res = await request(app)
        .get('/api/analytics/orders/per-day')
        .set('Authorization', `Bearer ${adminToken}`); // adjust endpoint as needed

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBe(7);

      type Day = Record<OrderStatus, number> & {
        date: string;
      };

      res.body.data.data.forEach((day: Day) => {
        expect(day).toHaveProperty('date');
        expect(typeof day.date).toBe('string');

        // These are the expected status keys
        const expectedStatuses = ['PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED'];

        expectedStatuses.forEach((status) => {
          expect(day).toHaveProperty(status);
          expect(typeof day[status as OrderStatus]).toBe('number');
        });
      });
    });
  });
});
