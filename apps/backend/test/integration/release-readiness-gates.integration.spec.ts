import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  closeIntegrationTestApp,
  createIntegrationTestApp,
} from '@/common/test/test-app.module';

describeIntegration('Release Readiness Gates Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    expect(moduleFixture).toBeDefined();
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('exposes health endpoint with enriched payload', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        success: true,
        data: expect.objectContaining({
          status: expect.any(String),
          service: expect.any(String),
          dependencies: expect.any(Object),
        }),
      }),
    );
  });

  it('exposes prometheus metrics endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/metrics');
    expect(response.status).toBe(200);
    expect(typeof response.text).toBe('string');
    expect(response.text).toContain('luneo_process_uptime_seconds');
    expect(response.text).toContain('luneo_dependency_up');
  });

  it('exposes SLO status endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/slo');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          objectivePercent: expect.any(Number),
          currentAvailabilityPercent: expect.any(Number),
          errorBudgetRemainingPercent: expect.any(Number),
          burnRate: expect.any(Number),
          status: expect.any(String),
        }),
      }),
    );
  });

  it('exposes error budget endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/error-budget');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          objectivePercent: expect.any(Number),
          errorBudgetPercent: expect.any(Number),
          errorBudgetRemainingPercent: expect.any(Number),
        }),
      }),
    );
  });

  it('rejects Stripe webhook calls without signature', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/billing/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'checkout.session.completed' }));
    expect(response.status).toBe(400);
    expect(String(response.body?.message || '')).toContain('Missing Stripe signature');
  });

  it('protects billing subscription endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/billing/subscription');
    expect(response.status).toBe(401);
  });

  it('protects usage-billing summary endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/usage-billing/summary');
    expect(response.status).toBe(401);
  });

  it('protects integrations status endpoint', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/integrations/status');
    expect(response.status).toBe(401);
  });

  it('protects integrations sync endpoint', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/integrations/shopify/sync');
    expect(response.status).toBe(403);
    expect(String(response.body?.message || '')).toContain('CSRF');
  });
});
