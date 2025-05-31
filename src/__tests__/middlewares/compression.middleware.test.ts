import express, { Request, Response } from 'express';
import request from 'supertest';

import compressionMiddleware from '@/middleware/compression.middleware';

describe('Compression middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();

    // Add compression middleware
    app.use(compressionMiddleware);

    // A test route with large response to trigger compression
    app.get('/test', (_req: Request, res: Response) => {
      const largeData = 'hello'.repeat(1000); // create a large enough response
      res.send(largeData);
    });
  });

  it('should compress response by default', async () => {
    const res = await request(app).get('/test');

    expect(res.headers['content-encoding']).toBe('gzip');
    expect(res.statusCode).toBe(200);
  });

  it('should NOT compress response if x-no-compression header is set', async () => {
    const res = await request(app).get('/test').set('x-no-compression', 'true');

    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.statusCode).toBe(200);
  });
});
