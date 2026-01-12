/**
 * Security Tests - SQL Injection
 * Tests all endpoints for SQL injection vulnerabilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Security Tests - SQL Injection', () => {
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

  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "admin'--",
    "admin'/*",
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL,NULL--",
    "1' OR '1'='1",
    "1' OR '1'='1' --",
    "1' OR '1'='1' /*",
    "1' OR '1'='1' UNION SELECT NULL--",
    "'; DROP TABLE users; --",
    "'; DELETE FROM users; --",
    "1'; DROP TABLE users; --",
    "' OR 1=1--",
    "' OR 1=1#",
    "' OR 1=1/*",
  ];

  describe('SQL Injection - Auth Endpoints', () => {
    it('should prevent SQL injection in login email', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: 'test',
          });

        // Should return 400 or 401, not 500 (which would indicate SQL error)
        expect([400, 401]).toContain(response.status);
      }
    });

    it('should prevent SQL injection in signup email', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: payload,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
          });

        // Should return 400, not 500
        expect([400, 409]).toContain(response.status);
      }
    });
  });

  describe('SQL Injection - Query Parameters', () => {
    it('should prevent SQL injection in product ID', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/products/${payload}`);

        // Should return 400 or 404, not 500
        expect([400, 404]).toContain(response.status);
      }
    });

    it('should prevent SQL injection in search query', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/products?search=${encodeURIComponent(payload)}`);

        // Should return 200 or 400, not 500
        expect([200, 400, 401]).toContain(response.status);
      }
    });
  });

  describe('SQL Injection - Order By', () => {
    it('should prevent SQL injection in orderBy parameter', async () => {
      const maliciousOrderBy = [
        "id; DROP TABLE users; --",
        "id' UNION SELECT NULL--",
        "id; DELETE FROM users; --",
      ];

      for (const payload of maliciousOrderBy) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/products?orderBy=${encodeURIComponent(payload)}`);

        // Should return 400 or 200 (with sanitized orderBy), not 500
        expect([200, 400, 401]).toContain(response.status);
      }
    });
  });
});
