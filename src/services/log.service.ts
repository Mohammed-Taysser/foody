import { winstonLogger } from '@/utils/logger.utils';

class LoggerService {
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

const LOGGER = new LoggerService();

export default LOGGER;
export { LoggerService };
