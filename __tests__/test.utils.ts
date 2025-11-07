import { Response } from 'supertest';

/**
 * Helper to parse CSV responses from Supertest
 */
function parseCsvResponse(res: Response, callback: (err: Error | null, body?: string) => void) {
  const chunks: string[] = [];
  res.setEncoding('utf8');

  res.on('data', (chunk: string) => chunks.push(chunk));
  res.on('end', () => callback(null, chunks.join('')));
}

/**
 * Helper to parse EXCEL responses from Supertest
 */
function parseExcelResponse(res: Response, callback: (err: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}

export { parseCsvResponse, parseExcelResponse };
