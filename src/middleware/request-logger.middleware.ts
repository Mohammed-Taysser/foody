import morgan from 'morgan';

import LOGGER from '@/services/log.service';

const stream = {
  write: (message: string) => LOGGER.http(message.trim()),
};

const requestLoggerMiddleware = morgan('combined', { stream });

export default requestLoggerMiddleware;
