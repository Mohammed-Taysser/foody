import { winstonLogger } from '@/utils/logger.utils';

class WinstonLoggerService {
  info(message: string, module?: AppModules) {
    winstonLogger.info(message, { label: module });
  }

  error(message: string, module?: AppModules) {
    winstonLogger.error(message, { label: module });
  }

  warn(message: string, module?: AppModules) {
    winstonLogger.warn(message, { label: module });
  }

  http(message: string, module?: AppModules) {
    winstonLogger.http(message, { label: module });
  }
}

const WINSTON_LOGGER = new WinstonLoggerService();

export default WINSTON_LOGGER;
export { WinstonLoggerService };
