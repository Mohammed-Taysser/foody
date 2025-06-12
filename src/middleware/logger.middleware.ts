import morgan from 'morgan';

import WINSTON_LOGGER from '@/services/winston-log.service';

const stream = {
  write: (message: string) => WINSTON_LOGGER.http(message.trim()),
};

const loggerMiddleware = [morgan('dev'), morgan('combined', { stream })];

export default loggerMiddleware;
