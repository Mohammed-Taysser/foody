import request from 'supertest';

import app from '@/app';

describe('Dashboard Analytics', () => {
  it('should return analytics', async () => {
    const res = await request(app).get('/api/analytics');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totals');
    expect(res.body.data).toHaveProperty('thisWeek');
    expect(res.body.data).toHaveProperty('lastWeek');
    expect(res.body.data).toHaveProperty('growth');

    const sections = ['users', 'restaurants', 'categories', 'menuItem'];

    sections.forEach((section) => {
      expect(res.body.data.totals).toHaveProperty(section);
      expect(res.body.data.thisWeek).toHaveProperty(section);
      expect(res.body.data.lastWeek).toHaveProperty(section);
      expect(res.body.data.growth).toHaveProperty(section);
    });
  });
});
