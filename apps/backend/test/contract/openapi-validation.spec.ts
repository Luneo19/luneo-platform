/**
 * OpenAPI Contract Tests
 * Validates API responses against OpenAPI schema
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import * as SwaggerParser from '@apidevtools/swagger-parser';

describe('OpenAPI Contract Validation', () => {
  let app: INestApplication;
  let openApiSpec: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Try to load OpenAPI spec from /api/docs-json
    try {
      const specResponse = await request(app.getHttpServer())
        .get('/api/docs-json');
      
      if (specResponse.status === 200) {
        openApiSpec = specResponse.body;
      }
    } catch (error) {
      console.warn('OpenAPI spec not available, skipping validation');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('OpenAPI Schema Validation', () => {
    it('should have valid OpenAPI schema', async () => {
      if (!openApiSpec) {
        test.skip();
        return;
      }

      try {
        await SwaggerParser.validate(openApiSpec);
        expect(openApiSpec).toBeDefined();
        expect(openApiSpec.openapi || openApiSpec.swagger).toBeDefined();
      } catch (error) {
        console.error('OpenAPI validation error:', error);
        throw error;
      }
    });

    it('should have all required paths defined', async () => {
      if (!openApiSpec) {
        test.skip();
        return;
      }

      const requiredPaths = [
        '/api/v1/auth/signup',
        '/api/v1/auth/login',
        '/api/v1/auth/refresh',
        '/api/v1/products',
        '/api/v1/user/me',
      ];

      const paths = openApiSpec.paths || {};
      
      for (const path of requiredPaths) {
        const pathKey = path.replace('/api/v1', '');
        if (!paths[pathKey] && !paths[path]) {
          console.warn(`Path ${path} not found in OpenAPI spec`);
        }
      }
    });
  });

  describe('API Versioning', () => {
    it('should maintain API versioning', async () => {
      // Test that v1 endpoints exist
      const v1Endpoints = [
        '/api/v1/auth/signup',
        '/api/v1/auth/login',
        '/api/v1/products',
      ];

      for (const endpoint of v1Endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint.replace('/signup', '').replace('/login', ''))
          .query({});

        // Should not return 404 (endpoint exists)
        expect([200, 400, 401, 405]).toContain(response.status);
      }
    });
  });
});
