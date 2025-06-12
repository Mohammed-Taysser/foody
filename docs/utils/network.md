# Network Utilities

A collection of helper functions for working with network interfaces, IP addresses, ports, and availability.

## getLocalIp

Returns the primary non-internal local IPv4 address.

### Returns

- `string` — IPv4 address like `'192.168.1.42'` or `'localhost'` (fallback)

### Example

```ts
getLocalIp(); // '192.168.1.42' or 'localhost'
```

## isPortAvailable

Checks if a specific TCP port is currently available for use.

### Parameters

- `port: number` — The port number to check.

### Returns

- `Promise<boolean>` — Resolves to true if the port is `free`, otherwise `false`.

### Example

```ts
await isPortAvailable(3000); // true or false
```

## findAvailablePort

Scans for the next free port starting from a given port up to maxPort.

### Parameters

- `startPort: number` — Port number to begin scanning from.
- `maxPort?: number` — Optional upper limit for port scan (default 65535).

### Returns

- `Promise<number>` — Resolves to the first available port number.

### Example

```ts
await findAvailablePort(3000); // 3000 or 3001, etc.
```

## getAllLocalIps

Returns all non-internal IPv4 addresses from the system's network interfaces.

### Returns

- `string[]` — An array of local IP addresses.

### Example

```ts
getAllLocalIps(); // ['192.168.1.42', '10.0.0.5']
```

## getMacAddresses

Returns all MAC addresses found on the machine, excluding loopback and internal interfaces.

### Returns

- `string[]` — Array of MAC addresses in standard format ('`00:1a:2b:3c:4d:5e`').

### Example

```ts
getMacAddresses(); // ['00:1a:2b:3c:4d:5e']
```

## ping

Sends a ping to the given host to check if it is reachable.

### Parameters

- `host: string` — Hostname or IP address to ping.
- `timeout?: number` — Optional timeout in milliseconds (default `1000`).

### Returns

- `Promise<boolean>` — Resolves to true if the host is reachable, otherwise false.

### Example

```ts
await ping('google.com'); // true
```

## getNetworkInterfaces

Provides detailed information about each active network interface.

### Returns

- `Array<{ name, address, mac, internal }>` — Metadata for each network interface.

### Example

```ts
getNetworkInterfaces();
/* [
  { name: 'eth0', address: '192.168.1.42', mac: '00:1a:2b:3c:4d:5e', internal: false }
] */
```
