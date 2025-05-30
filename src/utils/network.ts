import { exec } from 'child_process';
import net from 'net';
import os from 'os';

function getLocalIp(): string {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false); // Port is in use
    });

    server.once('listening', () => {
      server.close();
      resolve(true); // Port is free
    });

    server.listen(port);
  });
}

async function findAvailablePort(startPort: number, maxPort = 65535): Promise<number> {
  for (let port = startPort; port <= maxPort; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error('No available port found');
}

function getAllLocalIps(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.length ? ips : ['localhost'];
}

function getMacAddresses(): string[] {
  const nets = os.networkInterfaces();
  const macs: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.mac && net.mac !== '00:00:00:00:00:00') {
        macs.push(net.mac);
      }
    }
  }
  return macs;
}

function ping(host: string, timeout = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const platform = process.platform;
    const cmd =
      platform === 'win32'
        ? `ping -n 1 -w ${timeout} ${host}`
        : `ping -c 1 -W ${timeout / 1000} ${host}`;

    exec(cmd, (error) => {
      resolve(!error);
    });
  });
}

function getNetworkInterfaces(): Array<{
  name: string;
  address: string;
  mac: string;
  internal: boolean;
}> {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      results.push({
        name,
        address: net.address,
        mac: net.mac,
        internal: net.internal,
      });
    }
  }
  return results;
}

export {
  findAvailablePort,
  getAllLocalIps,
  getLocalIp,
  getMacAddresses,
  getNetworkInterfaces,
  isPortAvailable,
  ping,
};
