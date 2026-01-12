/**
 * Security Tests - XSS (Cross-Site Scripting)
 * Tests all inputs for XSS vulnerabilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Security Tests - XSS', () => {
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

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<select onfocus=alert("XSS") autofocus>',
    '<textarea onfocus=alert("XSS") autofocus>',
    '<keygen onfocus=alert("XSS") autofocus>',
    '<video><source onerror="alert(\'XSS\')">',
    '<audio src=x onerror=alert("XSS")>',
    '<details open ontoggle=alert("XSS")>',
    '<marquee onstart=alert("XSS")>',
    '<math><mi//xlink:href="data:x,<script>alert(\'XSS\')</script>">',
    '"><script>alert("XSS")</script>',
    "';alert('XSS');//",
    '"><img src=x onerror=alert("XSS")>',
    '<script>document.cookie</script>',
    '<script>document.location="http://evil.com"</script>',
  ];

  describe('XSS - Form Inputs', () => {
    it('should sanitize XSS in signup firstName', async () => {
      for (const payload of xssPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: 'xss-test@example.com',
            password: 'TestPassword123!',
            firstName: payload,
            lastName: 'User',
          });

        // Should either reject (400) or sanitize (201)
        if (response.status === 201) {
          // If user is created, verify XSS is sanitized
          expect(response.body.user.firstName).not.toContain('<script>');
          expect(response.body.user.firstName).not.toContain('javascript:');
        } else {
          expect(response.status).toBe(400);
        }
      }
    });

    it('should sanitize XSS in signup lastName', async () => {
      for (const payload of xssPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/signup')
          .send({
            email: `xss-test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: payload,
          });

        if (response.status === 201) {
          expect(response.body.user.lastName).not.toContain('<script>');
          expect(response.body.user.lastName).not.toContain('javascript:');
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('XSS - Query Parameters', () => {
    it('should sanitize XSS in search query', async () => {
      for (const payload of xssPayloads.slice(0, 5)) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/products?search=${encodeURIComponent(payload)}`);

        // Should return 200 or 400, not execute script
        expect([200, 400, 401]).toContain(response.status);
        
        if (response.status === 200) {
          // Response should not contain script tags
          expect(response.text).not.toContain('<script>');
        }
      }
    });
  });

  describe('XSS - Response Headers', () => {
    it('should set XSS protection headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health');

      // Should have X-XSS-Protection header
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });
});
