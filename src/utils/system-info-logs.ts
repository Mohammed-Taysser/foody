import os from 'os';

import chalk from 'chalk';

import pkg from '../../package.json';

import { getLocalIp } from './network';

import ennValidation from '@/config/config';

function logServerInfo(startTime: number, port: number) {
  const duration = Date.now() - startTime;
  const localIp = getLocalIp();
  const startedAt = new Date().toLocaleTimeString();

  const localUrl = `http://localhost:${port}/`;
  const networkUrl = `http://${localIp}:${port}/`;
  const docsUrl = `http://localhost:${port}/docs`;
  const healthUrl = `http://localhost:${port}/health`;

  const header = `${pkg.name} v${pkg.version} ready in ${duration} ms`;

  console.log('\n' + chalk.green.bold(header) + '\n');

  console.log(chalk.gray('🕒 Started at:'), chalk.white(startedAt));
  console.log(chalk.gray('🧩 Node:      '), chalk.white(process.version));
  console.log(
    chalk.gray('🖥️  Platform:  '),
    chalk.white(`${os.type()} ${os.arch()} (${os.platform()})`)
  );
  console.log(
    `🔧 ${chalk.gray('ENV:')}        ${chalk.white(ennValidation.NODE_ENV.toUpperCase())}`
  );
  console.log();

  console.log(chalk.green('➜') + '  Local:   ' + chalk.cyan(localUrl));
  console.log(chalk.yellow('➜') + '  Network: ' + chalk.white(networkUrl));
  console.log(chalk.gray('➜') + '  Docs:    ' + chalk.magenta(docsUrl));
  console.log(chalk.gray('➜') + '  Health:  ' + chalk.blue(healthUrl));
  console.log('\n' + chalk.gray('💡 Tip:'), chalk.white('Press Ctrl+C to stop the server.') + '\n');
}

export { logServerInfo };
