import request from 'supertest';

import app from '@/app';

describe('Dashboard Analytics', () => {
  it('should return analytics', async () => {
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
});
