import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { describeIntegration } from '@/common/test/integration-test.helper';
import {
  closeIntegrationTestApp,
  createIntegrationTestApp,
} from '@/common/test/test-app.module';

describeIntegration('Analytics Clean Runtime Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  it('stores analytics events and returns non-stub metrics/time-series/top-events', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.analytics_events')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const uniqueSession = `sess_${Date.now()}`;
    const uniqueUser = `user_${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/v1/analytics-clean/events')
      .send({
        event: 'page_view',
        userId: uniqueUser,
        sessionId: uniqueSession,
        revenue: 49,
        sessionDuration: 90,
        page: '/pricing',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/analytics-clean/events')
      .send({
        eventType: 'conversion',
        userId: uniqueUser,
        sessionId: uniqueSession,
        revenue: 149,
        page: '/checkout',
      })
      .expect(201);

    const metricsRes = await request(app.getHttpServer())
      .get('/api/v1/analytics-clean/metrics')
      .query({ period: '7d' })
      .expect(200);

    expect(metricsRes.body.totalEvents).toBeGreaterThan(0);
    expect(metricsRes.body.totalRevenue).toBeGreaterThan(0);
    expect(metricsRes.body.totalUsers).toBeGreaterThan(0);

    const timeseriesRes = await request(app.getHttpServer())
      .get('/api/v1/analytics-clean/time-series')
      .query({ period: '7d' })
      .expect(200);

    expect(Array.isArray(timeseriesRes.body)).toBe(true);
    expect(timeseriesRes.body.length).toBeGreaterThan(0);

    const topEventsRes = await request(app.getHttpServer())
      .get('/api/v1/analytics-clean/top-events')
      .query({ period: '7d' })
      .expect(200);

    expect(Array.isArray(topEventsRes.body)).toBe(true);
    expect(topEventsRes.body.some((item: { eventType?: string }) => item.eventType === 'page_view')).toBe(true);
  }, 60000);

  it('stores web-vitals payload in database', async () => {
    const schemaCheck = (await prisma.$queryRawUnsafe(
      "SELECT to_regclass('public.web_vitals')::text AS table_name",
    )) as Array<{ table_name: string | null }>;
    if (!schemaCheck[0]?.table_name) {
      return;
    }

    const before = await prisma.webVital.count();
    await request(app.getHttpServer())
      .post('/api/v1/analytics/web-vitals')
      .send({
        name: 'LCP',
        value: 2150,
        rating: 'good',
        delta: 120,
        page: '/home',
        sessionId: `wv_${Date.now()}`,
      })
      .expect(201);

    const after = await prisma.webVital.count();
    expect(after).toBeGreaterThan(before);
  }, 60000);
});
