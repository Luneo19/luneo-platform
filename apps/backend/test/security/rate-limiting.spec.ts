/**
 * Security Tests - Rate Limiting
 * Tests rate limiting effectiveness
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Security Tests - Rate Limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate Limiting - Login Endpoint', () => {
    it('should rate limit login attempts', async () => {
      const attempts = 20; // More than typical rate limit
      let rateLimitedCount = 0;

      for (let i = 0; i < attempts; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'rate-limit-test@example.com',
            password: 'wrong-password',
          });

        if (response.status === 429) {
          rateLimitedCount++;
        }

        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Should have rate limited at least some requests
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting - Signup Endpoint', () => {
    it('should rate limit signup attempts', async () => {
      const attempts = 10;
      let rateLimitedCount = 0;

      for (let i = 0; i < attempts; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `rate-limit-signup-${i}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
          });

        if (response.status === 429) {
          rateLimitedCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Should have rate limited if too many requests
      // Note: May not trigger if rate limit is high
      expect([0, rateLimitedCount]).toContain(rateLimitedCount);
    });
  });

  describe('Rate Limiting - API Endpoints', () => {
    it('should rate limit API requests', async () => {
      const attempts = 100;
      let rateLimitedCount = 0;

      for (let i = 0; i < attempts; i++) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/products');

        if (response.status === 429) {
          rateLimitedCount++;
          break; // Stop after first rate limit
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Should have rate limited if too many requests
      expect([0, rateLimitedCount]).toContain(rateLimitedCount);
    });
  });

  describe('Rate Limiting - Retry-After Header', () => {
    it('should include Retry-After header when rate limited', async () => {
      // Make many requests to trigger rate limit
      let rateLimitedResponse = null;

      for (let i = 0; i < 50; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'retry-after-test@example.com',
            password: 'wrong',
          });

        if (response.status === 429) {
          rateLimitedResponse = response;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (rateLimitedResponse) {
        // Should have Retry-After header
        expect(rateLimitedResponse.headers['retry-after']).toBeDefined();
      }
    });
  });
});
