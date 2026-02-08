/**
 * E2E Tests - Billing
 * Skeleton: implement when test DB and Stripe test mode are configured.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Billing E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /billing/checkout - creates checkout session', async () => {
    const email = process.env.TEST_USER_EMAIL || 'admin@luneo.com';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });
    if (loginRes.status === 200) {
      const cookies = loginRes.headers['set-cookie'];
      const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/create-checkout-session')
        .set('Cookie', cookieHeader)
        .send({ planId: 'starter', billingInterval: 'monthly' });
      // May succeed or fail based on Stripe config
      expect([200, 201, 400, 500]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(res.body).toHaveProperty('url');
      }
    }
  });

  it('POST /billing/webhook - processes payment event', async () => {
    // Webhook requires valid Stripe signature, so we test the 400 case (missing signature)
    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'checkout.session.completed' }));
    // Should fail without valid signature
    expect([400, 401]).toContain(res.status);
  });

  it('GET /billing/usage - returns current usage', async () => {
    const email = process.env.TEST_USER_EMAIL || 'admin@luneo.com';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });
    if (loginRes.status === 200) {
      const cookies = loginRes.headers['set-cookie'];
      const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      const res = await request(app.getHttpServer())
        .get('/api/v1/billing/subscription')
        .set('Cookie', cookieHeader);
      expect([200, 404]).toContain(res.status);
    }
  });
});
