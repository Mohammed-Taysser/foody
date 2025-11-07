import os from 'node:os';

import chalk from 'chalk';

import pkg from '../../package.json';

import { getLocalIp } from './network';

import ennValidation from '@/apps/config';

function logServerInfo(startTime: number, port: number) {
  const duration = Date.now() - startTime;
  const localIp = getLocalIp();
  const startedAt = new Date().toLocaleTimeString();

  const localUrl = `http://localhost:${port}/`;
  const networkUrl = `http://${localIp}:${port}/`;
  const docsUrl = `http://localhost:${port}/docs`;
  const healthUrl = `http://localhost:${port}/health`;

  const header = `${pkg.name} v${pkg.version} ready in ${duration} ms`;

  console.warn('\n' + chalk.green.bold(header) + '\n');

  console.warn(chalk.gray('🕒 Started at:'), chalk.white(startedAt));
  console.warn(chalk.gray('🧩 Node:      '), chalk.white(process.version));
  console.warn(
    chalk.gray('🖥️  Platform:  '),
    chalk.white(`${os.type()} ${os.arch()} (${os.platform()})`)
  );
  console.warn(
    `🔧 ${chalk.gray('ENV:')}        ${chalk.white(ennValidation.NODE_ENV.toUpperCase())}`
  );
  console.warn();

  console.warn(chalk.green('➜') + '  Local:   ' + chalk.cyan(localUrl));
  console.warn(chalk.yellow('➜') + '  Network: ' + chalk.white(networkUrl));
  console.warn(chalk.gray('➜') + '  Docs:    ' + chalk.magenta(docsUrl));
  console.warn(chalk.gray('➜') + '  Health:  ' + chalk.blue(healthUrl));
  console.warn(
    '\n' + chalk.gray('💡 Tip:'),
    chalk.white('Press Ctrl+C to stop the server.') + '\n'
  );
}

export { logServerInfo };
