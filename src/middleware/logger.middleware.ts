import morgan from 'morgan';

import LOGGER from '@/services/log.service';

const stream = {
  write: (message: string) => LOGGER.http(message.trim()),
};

const loggerMiddleware = [morgan('dev'), morgan('combined', { stream })];

export default loggerMiddleware;
