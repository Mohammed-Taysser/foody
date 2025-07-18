import { Request, Response } from 'express';
import morgan, { TokenIndexer } from 'morgan';

import { AuthenticatedRequest } from '@/types/import';
import logger from '@/utils/logger.utils';

const stream = {
  write: (message: string) => {
    try {
      const parsed = JSON.parse(message);
      logger.http(parsed); // structured log
    } catch {
      logger.http(message.trim()); // fallback
    }
  },
};

// Custom token formatter returning structured JSON string
const customMorganFormat = (
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
): string => {
  const safeJson = (input: unknown, maxLength = 1000) => {
    try {
      const json = JSON.stringify(input);
      return json.length > maxLength ? '[TRUNCATED]' : json;
    } catch {
      return '[UNSERIALIZABLE]';
    }
  };

  const data = {
    ip: tokens['remote-addr'](req, res),
    user: (req as AuthenticatedRequest).user?.id || '[ANONYMOUS]', // adjust to your auth system
    time: tokens.date(req, res, 'iso'),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    httpVersion: req.httpVersion,
    status: Number(tokens.status(req, res)),
    contentLength: tokens.res(req, res, 'content-length') || 0,
    referrer: tokens.referrer(req, res),
    userAgent: tokens['user-agent'](req, res),
    query: req.query && Object.keys(req.query).length ? req.query : undefined,
    body: req.body && Object.keys(req.body).length ? safeJson(req.body, 2000) : undefined,
    responseTimeMs: parseFloat(tokens['response-time'](req, res) || '0'),
    response: res.statusCode >= 400 ? safeJson(res.statusMessage, 2000) : undefined,
    headers:
      req.headers && Object.keys(req.headers).length ? safeJson(req.headers, 2000) : undefined,
    cookies:
      req.cookies && Object.keys(req.cookies).length ? safeJson(req.cookies, 2000) : undefined,
  };

  return JSON.stringify(data);
};

const loggerMiddleware = [morgan('dev'), morgan(customMorganFormat, { stream })];

export default loggerMiddleware;
