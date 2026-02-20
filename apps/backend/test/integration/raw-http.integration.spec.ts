/**
 * Raw HTTP Test
 * Tests direct HTTP connection without NestJS module
 */

import * as http from 'http';
import { describeIntegration } from '@/common/test/integration-test.helper';

describeIntegration('Raw HTTP Test', () => {
  it('should make HTTP request', async () => {
    console.log('[TEST] Creating raw HTTP server...');
    
    // Create a simple server
    const server = http.createServer((req, res) => {
      console.log('[SERVER] Received request:', req.method, req.url);
      
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        console.log('[SERVER] Body:', body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });
    });

    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as unknown).port;
    console.log('[TEST] Server listening on port:', port);

    // Make request
    const response = await new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path: '/test',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode!, body: JSON.parse(data) });
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify({ test: true }));
      req.end();
    });

    console.log('[TEST] Response:', response);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Cleanup
    await new Promise<void>(resolve => server.close(() => resolve()));
  }, 10000);
});
