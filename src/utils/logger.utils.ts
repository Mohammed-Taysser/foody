import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// --- FORMATTER ---
const logFormat = winston.format.printf(({ timestamp, level, message, label, ...meta }) => {
  const log = {
    time: timestamp,
    level,
    label,
    message,
    ...meta,
  };
  return JSON.stringify(log);
});

// --- CREATE LABELED TRANSPORT ---
const createLabeledTransport = (label: string) =>
  new DailyRotateFile({
    filename: `logs/${label}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '10m',
    maxFiles: '14d',
    zippedArchive: true,
    level: 'info',
    format: winston.format.combine(
      winston.format((info) => {
        // Filter out logs that don't match this label
        return info.label === label ? info : false;
      })(),
      winston.format.label({ label }),
      winston.format.timestamp(),
      logFormat
    ),
  });

// --- GENERAL APP TRANSPORT ---
const appTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '14d',
  zippedArchive: true,
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
});

// --- BASE LOGGER ---
const baseLogger = winston.createLogger({
  level: 'info',
  transports: [
    appTransport,
    createLabeledTransport('database'),
    createLabeledTransport('socket'),
    createLabeledTransport('task'),
    createLabeledTransport('http'),
  ],
});

// --- DYNAMIC LABEL WRAPPER ---
const logWithLabel = (label: string) => {
  return (message: string, meta: Record<string, unknown> = {}) => {
    baseLogger.log({
      level: 'info',
      message,
      label,
      ...meta,
    });
  };
};

// --- EXPORT COMBINED LOGGER ---
const logger = {
  // general logging
  info: baseLogger.info.bind(baseLogger),
  warn: baseLogger.warn.bind(baseLogger),
  error: baseLogger.error.bind(baseLogger),

  // custom labeled categories
  db: logWithLabel('database'),
  socket: logWithLabel('socket'),
  task: logWithLabel('task'),
  http: logWithLabel('http'),
};

export default logger;
