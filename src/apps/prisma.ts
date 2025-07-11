import { PrismaClient } from '@prisma/client';

import logger from '@/utils/logger.utils';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

// Listen to events
prisma.$on('query', (e) => {
  logger.db(
    JSON.stringify({
      type: e.duration > 1000 ? 'slow_query' : 'query',
      ...e,
    })
  );
});

prisma.$on('info', (e) => {
  logger.db(JSON.stringify({ type: 'info', ...e }));
});

prisma.$on('warn', (e) => {
  logger.db(JSON.stringify({ type: 'warn', ...e }));
});

prisma.$on('error', (e) => {
  logger.db(JSON.stringify({ type: 'error', ...e }));
});

export default prisma;
