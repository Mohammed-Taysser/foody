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

export { getLocalIp, isPortAvailable };
