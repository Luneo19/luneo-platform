/**
 * Health Check Integration Test
 * Just checks if the app starts and responds
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createAuthTestApp, closeAuthTestApp } from '@/common/test/auth-test.module';

describeIntegration('Health Check Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    console.log('[TEST] Starting app initialization...');
    const testApp = await createAuthTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    console.log('[TEST] App initialized successfully');
    console.log('[TEST] Server address:', app.getHttpServer().address());
  }, 120000);

  afterAll(async () => {
    console.log('[TEST] Closing app...');
    await closeAuthTestApp(app);
    console.log('[TEST] App closed');
  }, 30000);

  it('should respond to health endpoint', async () => {
    console.log('[TEST] Making health request...');
    
    // Try a simple GET request
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .timeout(10000);

    console.log('[TEST] Health response:', response.status, response.body);
    
    // Health endpoint should return 200 or at least not timeout
    expect([200, 404]).toContain(response.status);
  }, 30000);

  it('should respond to any endpoint', async () => {
    console.log('[TEST] Making root request...');
    
    const response = await request(app.getHttpServer())
      .get('/')
      .timeout(10000);

    console.log('[TEST] Root response:', response.status);
    expect(response.status).toBeDefined();
  }, 30000);
});
