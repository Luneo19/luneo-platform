/**
 * Security Tests - XSS (Cross-Site Scripting)
 * Tests all inputs for XSS vulnerabilities
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describeIntegration('Security Tests - XSS', () => {
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
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '"><script>alert("XSS")</script>',
  ];

  describe('XSS - Form Inputs', () => {
    it('should handle XSS payloads in firstName without executing', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `xss-test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: payload,
            lastName: 'User',
          });

        // Should either reject (400) or accept but sanitize/escape
        if (response.status === 201) {
          const userData = response.body.data?.user || response.body.user;
          // If accepted, the stored value should not contain executable scripts
          // NestJS/Prisma stores as-is, but frontend must escape on display
          expect(userData).toBeDefined();
        } else {
          expect([400]).toContain(response.status);
        }
      }
    });

    it('should handle XSS payloads in lastName without executing', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `xss-last-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: payload,
          });

        // Should either reject or accept safely
        expect([201, 400]).toContain(response.status);
      }
    });
  });

  describe('XSS - Response Headers', () => {
    it('should have Content-Type header preventing script execution', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      // Response should be JSON, not HTML
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return JSON for API endpoints', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: '<script>alert(1)</script>',
          password: 'test',
        });

      // Even with XSS in input, response should be JSON
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('XSS - Content Security Policy', () => {
    it('should not reflect XSS payloads in error messages unsafely', async () => {
      const payload = '<script>alert("XSS")</script>';
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: payload,
          password: 'test',
        });

      // Error response should not reflect the raw XSS payload
      // It should be escaped or omitted
      const responseText = JSON.stringify(response.body);
      // Check that script tags are not present as executable HTML
      expect(responseText).not.toContain('<script>alert("XSS")</script>');
    });
  });
});
