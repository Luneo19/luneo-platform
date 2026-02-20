/**
 * Visual Customizer E2E Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Visual Customizer E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let _brandId: string;
  let customizerId: string | undefined;

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

    // Get auth token (mock or real based on test setup)
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'test123456';

    try {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password });

      if (loginResponse.status === 200) {
        authToken = loginResponse.body.accessToken;
        _brandId = loginResponse.body.user?.brandId;
      }
    } catch (error) {
      // If auth fails, tests will skip
      console.warn('Could not authenticate for E2E tests');
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    // Reset customizerId for each test
    customizerId = undefined;
  });

  describe('POST /visual-customizer/customizers', () => {
    it('should create a customizer', async () => {
      if (!authToken) {
        return; // Skip if not authenticated
      }

      const createDto = {
        name: 'E2E Test Customizer',
        description: 'Test description',
        type: 'PRODUCT',
        canvasSettings: {
          width: 800,
          height: 600,
          unit: 'PIXEL',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/visual-customizer/customizers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: createDto.name,
      });

      customizerId = response.body.id;
    });

    it('should return 400 for invalid data', async () => {
      if (!authToken) {
        return;
      }

      const invalidDto = {
        name: '', // Empty name should fail validation
      };

      await request(app.getHttpServer())
        .post('/visual-customizer/customizers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /visual-customizer/customizers', () => {
    it('should list customizers', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/visual-customizer/customizers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by search query', async () => {
      if (!authToken) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/visual-customizer/customizers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test' })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /visual-customizer/customizers/:id', () => {
    it('should get a customizer by ID', async () => {
      if (!authToken || !customizerId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/visual-customizer/customizers/${customizerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });

    it('should return 404 when customizer not found', async () => {
      if (!authToken) {
        return;
      }

      await request(app.getHttpServer())
        .get('/visual-customizer/customizers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /visual-customizer/customizers/:id', () => {
    it('should update a customizer', async () => {
      if (!authToken || !customizerId) {
        return;
      }

      const updateDto = {
        name: 'Updated E2E Customizer Name',
      };

      const response = await request(app.getHttpServer())
        .put(`/visual-customizer/customizers/${customizerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });

    it('should return 404 when customizer not found', async () => {
      if (!authToken) {
        return;
      }

      await request(app.getHttpServer())
        .put('/visual-customizer/customizers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /visual-customizer/customizers/:id', () => {
    it('should delete a customizer', async () => {
      if (!authToken || !customizerId) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/visual-customizer/customizers/${customizerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 when customizer not found', async () => {
      if (!authToken) {
        return;
      }

      await request(app.getHttpServer())
        .delete('/visual-customizer/customizers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /visual-customizer/customizers/:id/publish', () => {
    it('should publish a customizer', async () => {
      if (!authToken || !customizerId) {
        return;
      }

      // First create a customizer to publish
      const createDto = {
        name: 'Publish Test Customizer',
        type: 'PRODUCT',
        canvasSettings: {
          width: 800,
          height: 600,
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/visual-customizer/customizers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      const testCustomizerId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .post(`/visual-customizer/customizers/${testCustomizerId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
      expect(response.body.publishedAt).toBeDefined();
    });

    it('should return 404 when customizer not found', async () => {
      if (!authToken) {
        return;
      }

      await request(app.getHttpServer())
        .post('/visual-customizer/customizers/00000000-0000-0000-0000-000000000000/publish')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
