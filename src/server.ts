import chalk from 'chalk';

import WINSTON_LOGGER from './services/winston-log.service';
import { isPortAvailable } from './utils/network';
import { promptYesNo } from './utils/prompts';
import { logServerInfo } from './utils/system-info-logs';

import app from '@/app';
import ennValidation from '@/config/config';

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
    logServerInfo(startTime, port);
  })
  .catch((error) => {
    WINSTON_LOGGER.error('Error starting server:' + error);
    process.exit(1);
  });
