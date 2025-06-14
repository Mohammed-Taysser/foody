import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const customConsoleFormat = format.printf((info) => {
  const labelStr = info.label && typeof info.label === 'string' ? `[${info.label}] ` : '';
  return `${info.timestamp} [${info.level}] ${labelStr}: ${info.stack ?? info.message}`;
});

const winstonLogger = createLogger({
  level: 'info',
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.timestamp(), customConsoleFormat),
    }),
    createRotatingLogTransport('error', 'error'),
    createRotatingLogTransport('warn', 'warn', true),
    createRotatingLogTransport('http', 'http', true),
    createRotatingLogTransport('app'),
  ],
  exceptionHandlers: [createRotatingLogTransport('exceptions')],
  rejectionHandlers: [createRotatingLogTransport('rejections')],
});

function createRotatingLogTransport(fileName: string, level = 'info', exact = false) {
  const baseFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  );

  const filterByExactLevel = format((info) => (info.level === level ? info : false));

  const transport = new DailyRotateFile({
    filename: `logs/${fileName}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: exact ? format.combine(filterByExactLevel(), baseFormat) : baseFormat,
  });

  transport.on('rotate', (oldFilename, newFilename) => {
    console.log(`[Log Rotated] [${fileName}] [${level}] ${oldFilename} → ${newFilename}`);
  });

  return transport;
}

export { winstonLogger };
