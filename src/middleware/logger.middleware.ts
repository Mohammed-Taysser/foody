import { Request, Response } from 'express';
import morgan, { TokenIndexer } from 'morgan';

import WINSTON_LOGGER from '@/services/winston-log.service';

const stream = {
  write: (message: string) => WINSTON_LOGGER.http(message.trim()),
};

const customMorganFormat = (
  tokens: TokenIndexer<Request, Response>,
  req: Request,
  res: Response
): string => {
  const query = JSON.stringify(req.query);
  const body = JSON.stringify(req.body);

  return [
    tokens['remote-addr'](req, res),
    '-',
    tokens['remote-user'](req, res) || '-',
    `[${tokens.date(req, res, 'clf')}]`,
    `"${tokens.method(req, res)} ${tokens.url(req, res)} HTTP/${req.httpVersion}"`,
    tokens.status(req, res),
    tokens.res(req, res, 'content-length') || '-',
    `"${tokens.referrer(req, res) || '-'}"`,
    `"${tokens['user-agent'](req, res) || '-'}"`,
    `query=${query}`,
    `body=${body}`,
  ].join(' | ');
};

const loggerMiddleware = [morgan('dev'), morgan(customMorganFormat, { stream })];

export default loggerMiddleware;
