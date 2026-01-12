/**
 * Chaos Engineering Tests - External API Failures
 * Simulates external API failures and tests resilience
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

describe('Chaos Engineering - External API Failures', () => {
  let app: INestApplication;
  let httpService: HttpService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpService = moduleFixture.get<HttpService>(HttpService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('External API Timeout', () => {
    it('should handle external API timeout', async () => {
      // Mock HTTP service to simulate timeout
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Timeout')),
      );

      // Application should handle timeout gracefully
      const response = await request(app.getHttpServer())
        .get('/health');

      // Should not crash
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('External API 500 Error', () => {
    it('should handle external API 500 error', async () => {
      // Mock HTTP service to return 500
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => ({ response: { status: 500 } })),
      );

      const response = await request(app.getHttpServer())
        .get('/health');

      // Should handle error gracefully
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('External API Network Error', () => {
    it('should handle external API network error', async () => {
      // Mock network error
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const response = await request(app.getHttpServer())
        .get('/health');

      // Should not crash
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('External API Recovery', () => {
    it('should recover after external API reconnection', async () => {
      // Simulate failure
      jest.spyOn(httpService, 'get').mockReturnValueOnce(
        throwError(() => new Error('API unavailable')),
      );

      // First request should handle failure
      const failedResponse = await request(app.getHttpServer())
        .get('/health');
      
      expect([200, 503]).toContain(failedResponse.status);

      // Restore service
      jest.spyOn(httpService, 'get').mockReturnValue(
        of({ data: {}, status: 200 } as any),
      );

      // Second request should succeed
      const successResponse = await request(app.getHttpServer())
        .get('/health');

      expect(successResponse.status).toBe(200);
    });
  });
});
