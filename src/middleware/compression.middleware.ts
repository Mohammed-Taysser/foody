import compression from 'compression';
import { Request, Response } from 'express';

const compressionMiddleware = compression({
  filter: (request: Request, response: Response) => {
    if (request.headers['x-no-compression']) {
      // don't compress responses with this request header
      return false;
    }
    // fallback to standard filter function
    return compression.filter(request, response);
  },
});

export default compressionMiddleware;
