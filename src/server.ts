import chalk from 'chalk';

import logger from './utils/logger.utils';
import { isPortAvailable } from './utils/network';
import { promptYesNo } from './utils/prompts';
import { logServerInfo } from './utils/system-info-logs';

import app from '@/app';
import ennValidation from '@/apps/config';

const startTime = Date.now();

async function startServer() {
  let port = ennValidation.PORT;

  while (!(await isPortAvailable(port))) {
    console.log(chalk.red(`Port ${port} is already in use.`));
    const useAnother = await promptYesNo(`Do you want to use port ${port + 1} instead?`);
    if (!useAnother) {
      console.log(chalk.yellow('Server start cancelled.'));
      process.exit(1);
    }
    port++;
  }

  app.listen(port);

  return port;
}

startServer()
  .then((port) => {
    console.clear();
    logServerInfo(startTime, port);
  })
  .catch((error) => {
    logger.error('Error starting server:' + error);
    process.exit(1);
  });
