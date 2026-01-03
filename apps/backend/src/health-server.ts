// Simple health check server that runs before NestJS
// This ensures Railway's health check always works
import * as http from 'http';

export function createHealthServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
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
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[HEALTH-SERVER] Health check server listening on port ${port}`);
  });

  return server;
}

