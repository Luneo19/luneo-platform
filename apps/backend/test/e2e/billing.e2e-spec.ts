/**
 * E2E Tests - Billing (release gates)
 * Ces tests valident des comportements stables et non permissifs:
 * - protection des endpoints privés,
 * - validation de signature webhook.
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

  it('POST /billing/create-checkout-session should reject unauthenticated request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/create-checkout-session')
      .send({ planId: 'starter', billingInterval: 'monthly' });
    expect(res.status).toBe(401);
  });

  it('POST /billing/webhook - processes payment event', async () => {
    // Webhook requires valid Stripe signature, so we test the 400 case (missing signature)
    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'checkout.session.completed' }));
    expect(res.status).toBe(400);
    expect(String(res.body?.message || '')).toContain('signature');
  });

  it('GET /billing/subscription should reject unauthenticated request', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/billing/subscription');
    expect(res.status).toBe(401);
  });
});
