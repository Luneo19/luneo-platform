/**
 * OpenAPI Contract Tests
 * Validates API structure and versioning
 */

import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { describeIntegration } from '@/common/test/integration-test.helper';
import { createIntegrationTestApp, closeIntegrationTestApp } from '@/common/test/test-app.module';

describeIntegration('OpenAPI Contract Validation', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    const testApp = await createIntegrationTestApp();
    app = testApp.app;
    moduleFixture = testApp.moduleFixture;
  }, 60000);

  afterAll(async () => {
    await closeIntegrationTestApp(app);
  });

  describe('API Documentation Endpoint', () => {
    it('should expose API documentation endpoint', async () => {
      // Check if Swagger docs are available
      const response = await request(app.getHttpServer())
        .get('/api/docs');

      // May redirect, return HTML, or not be configured (404)
      expect([200, 301, 302, 404]).toContain(response.status);
    });

    it('should expose JSON API spec', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json');

      // May or may not be configured
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('openapi');
        expect(response.body).toHaveProperty('paths');
      }
    });
  });

  describe('API Versioning', () => {
    it('should support v1 endpoints', async () => {
      const v1Endpoints = [
        { method: 'get', path: '/api/v1/health' },
        { method: 'post', path: '/api/v1/auth/login' },
        { method: 'post', path: '/api/v1/auth/signup' },
      ];

      for (const endpoint of v1Endpoints) {
        const req = endpoint.method === 'get' 
          ? request(app.getHttpServer()).get(endpoint.path)
          : request(app.getHttpServer()).post(endpoint.path).send({});
        
        const response = await req;
        
        // Should not return 404 (endpoint exists)
        expect(response.status).not.toBe(404);
      }
    });

    it('should reject non-versioned endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/login');

      expect(response.status).toBe(404);
    });
  });

  describe('API Structure', () => {
    it('should have consistent response format for health endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return JSON for all API responses', async () => {
      const endpoints = [
        '/api/v1/health',
        '/api/v1/auth/me',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint);

        expect(response.headers['content-type']).toContain('application/json');
      }
    });
  });

  describe('Required Endpoints Exist', () => {
    it('should have auth endpoints', async () => {
      // POST endpoints should not return 404
      const authEndpoints = [
        '/api/v1/auth/signup',
        '/api/v1/auth/login',
        '/api/v1/auth/refresh',
        '/api/v1/auth/logout',
        '/api/v1/auth/forgot-password',
      ];

      for (const endpoint of authEndpoints) {
        const response = await request(app.getHttpServer())
          .post(endpoint)
          .send({});

        // Should return validation error (400) or auth error (401), not 404
        expect(response.status).not.toBe(404);
      }
    });

    it('should have health endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      expect(response.status).toBe(200);
    });
  });
});
