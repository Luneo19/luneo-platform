/**
 * Security Tests - SQL Injection
 * Tests all endpoints for SQL injection vulnerabilities
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describeIntegration('Security Tests - SQL Injection', () => {
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

  beforeEach(async () => {
    // Clean up
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin'--",
    "' UNION SELECT NULL--",
    "1' OR '1'='1",
    "'; DROP TABLE users; --",
    "' OR 1=1--",
  ];

  describe('SQL Injection - Auth Endpoints', () => {
    it('should prevent SQL injection in login email', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 3)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: 'test',
          });

        // Should return 400 (validation) or 401 (unauthorized), not 500 (SQL error)
        expect([400, 401]).toContain(response.status);
      }
    });

    it('should prevent SQL injection in signup email', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 3)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: payload,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
          });

        // Should return 400 (validation error), not 500 (SQL error)
        expect([400]).toContain(response.status);
      }
    });

    it('should prevent SQL injection in forgot-password email', async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 3)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/forgot-password')
          .send({
            email: payload,
          });

        // Should return 200 (silently ignore) or 400 (validation), not 500
        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('SQL Injection - Query Parameters', () => {
    it('should prevent SQL injection in URL parameters', async () => {
      const maliciousIds = [
        "' OR '1'='1",
        "1; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--",
      ];

      for (const payload of maliciousIds) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/products/${encodeURIComponent(payload)}`);

        // Should return 400 (invalid UUID) or 404, not 500
        expect([400, 401, 404]).toContain(response.status);
      }
    });
  });

  describe('SQL Injection - Prisma Protection', () => {
    it('should use parameterized queries (Prisma ORM)', async () => {
      // Prisma uses parameterized queries by default
      // This test verifies that even with malicious input, the query is safe
      const maliciousEmail = "test'; DROP TABLE \"User\"; --@example.com";
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: maliciousEmail,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        });

      // Should be rejected by email validation, not cause SQL error
      expect(response.status).toBe(400);
      
      // Verify users table still exists
      const count = await prisma.user.count();
      expect(typeof count).toBe('number');
    });
  });
});
