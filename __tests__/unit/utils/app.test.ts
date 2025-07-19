import request from 'supertest';

import app from '../../../src/app';

describe('App', () => {
  it('should return 200 for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('should serve swagger docs', async () => {
    const res = await request(app).get('/docs');
    expect(res.status).toBe(301); // Swagger redirects
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/some-unknown-path');
    expect(res.status).toBe(404);
  });
});
