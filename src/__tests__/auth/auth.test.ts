import request from 'supertest';

import app from '@/app';

describe('Auth routes', () => {
  it('should reject unauthenticated access to /me', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
