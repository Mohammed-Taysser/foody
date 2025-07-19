import os from 'os';

import { Request, Response } from 'express';

import { sendSuccessResponse } from '@/utils/send-response';

async function getHealthCheck(request: Request, response: Response) {
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) =>
      acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq,
    0
  );
  const cpuUsages = ((totalTick - totalIdle) / totalTick) * 100;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const memoryUsages = ((totalMem - freeMem) / totalMem) * 100;

  // getDiskUsage
  const diskUsages = 0;
  // getQueueSize
  // getActiveConnections

  let systemHealth = 'HEALTHY';
  if (cpuUsages > 90 || memoryUsages > 90 || diskUsages > 90) {
    systemHealth = 'DEGRADED';
  }
  if (cpuUsages > 95 || memoryUsages > 95 || diskUsages > 95) {
    systemHealth = 'DOWN';
  }

  sendSuccessResponse({
    response,
    message: 'System health check successful',
    data: {
      systemHealth,
      cpu: {
        totalIdle,
        totalTick,
        cpuUsages,
      },
      memory: {
        totalMem,
        freeMem,
        memoryUsages,
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      release: os.release(),
      totalCpus: cpus.length,
      systemType: os.type(),
      systemVersion: os.version(),
    },
  });
}

export { getHealthCheck };
