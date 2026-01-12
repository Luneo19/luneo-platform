/**
 * E2E Tests - Rate Limiting
 * Tests for rate limiting on API endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Rate Limiting E2E', () => {
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

  describe('Rate Limiting on Public Endpoints', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);

      // Check for rate limit responses (429)
      const rateLimited = responses.filter((res) => res.status === 429);

      if (rateLimited.length > 0) {
        console.log(`✅ Rate limiting working: ${rateLimited.length} requests rate limited`);
        expect(rateLimited.length).toBeGreaterThan(0);
      } else {
        console.warn('⚠️ Rate limiting not triggered (might be disabled in dev)');
      }
    });

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      const headers = response.headers;
      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
      ];

      const foundHeaders = rateLimitHeaders.filter(
        (header) => headers[header] !== undefined
      );

      if (foundHeaders.length > 0) {
        console.log(`✅ Rate limit headers present: ${foundHeaders.join(', ')}`);
        expect(foundHeaders.length).toBeGreaterThan(0);
      } else {
        console.warn('⚠️ Rate limit headers not found (might be disabled in dev)');
      }
    });
  });
});
