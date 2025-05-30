import chalk from 'chalk';

import { logServerInfo } from './utils/logger';
import { isPortAvailable } from './utils/network';
import { promptYesNo } from './utils/prompts';

import app from '@/app';
import CONFIG from '@/config/env';

const startTime = Date.now();

async function startServer() {
  let port = CONFIG.PORT;

  while (!(await isPortAvailable(port))) {
    console.log(chalk.red(`Port ${port} is already in use.`));
    const useAnother = await promptYesNo(`Do you want to use port ${port + 1} instead?`);
    if (!useAnother) {
      console.log(chalk.yellow('Server start cancelled.'));
      process.exit(1);
    }
    port++;
  }

  app.listen(port, () => {
    console.log(chalk.green(`Server is running on http://localhost:${port}`));
  });

  return port;
}

startServer()
  .then((port) => {
    logServerInfo(startTime, port);
  })
  .catch((error) => {
    console.error(chalk.red('Error starting server:'), error);
    process.exit(1);
  });
