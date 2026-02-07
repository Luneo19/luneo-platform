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
    // TODO: Implement when test DB and Stripe test keys are configured.
    // Login as test user, POST /api/v1/billing/checkout with planId, assert 200 and session URL or id.
  });

  it('POST /billing/webhook - processes payment event', async () => {
    // TODO: Implement when Stripe webhook secret is configured for tests.
    // POST /api/v1/billing/webhook with Stripe-Signature and event payload, assert 200 and side effects (e.g. subscription updated).
  });

  it('GET /billing/usage - returns current usage', async () => {
    // TODO: Implement when test DB is configured.
    // Login as test user with brand, GET /api/v1/billing/usage or subscription endpoint, assert 200 and usage/limits in body.
  });
});
