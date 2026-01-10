/**
 * Health Check Server
 * 
 * Separate HTTP server for Railway health checks
 * This runs on a different port and handles /health requests independently
 * of the main NestJS application, ensuring Railway health checks always work.
 */

import * as http from 'http';
import { Logger } from '@nestjs/common';

const logger = new Logger('HealthServer');

const HEALTH_PORT = process.env.HEALTH_PORT 
  ? parseInt(process.env.HEALTH_PORT, 10) 
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

export function startHealthServer(): http.Server {
  const server = http.createServer((req, res) => {
    // Only handle GET /health requests
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
      }));
      return;
    }
    
    // For all other requests, return 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.url}`,
    }));
  });

  server.listen(HEALTH_PORT, '0.0.0.0', () => {
    logger.log(`✅ Health check server listening on port ${HEALTH_PORT}`);
    logger.log(`   Health endpoint: http://0.0.0.0:${HEALTH_PORT}/health`);
  });

  return server;
}






