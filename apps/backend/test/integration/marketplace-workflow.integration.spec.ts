/**
 * @fileoverview Tests d'intégration pour le workflow Marketplace
 * @module MarketplaceWorkflow.integration.spec
 *
 * Conforme au plan PHASE 9 - Tests & CI/CD
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('Marketplace Workflow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let brandId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Créer un utilisateur de test et obtenir un token
    // (Simplifié pour l'exemple)
    const user = await prisma.user.create({
      data: {
        email: 'test-creator@example.com',
        password: 'hashed-password',
        role: 'CONSUMER',
      },
    });
    userId = user.id;

    // Créer un brand de test
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        slug: 'test-brand',
        plan: 'professional',
      },
    });
    brandId = brand.id;

    // Obtenir un token (simplifié)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.user.deleteMany({ where: { email: 'test-creator@example.com' } });
    await prisma.brand.deleteMany({ where: { slug: 'test-brand' } });
    await app.close();
  });

  describe('POST /marketplace/creators', () => {
    it('should create a creator profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/marketplace/creators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          username: 'testcreator',
          displayName: 'Test Creator',
          bio: 'Test bio',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('testcreator');
    });

    it('should return 400 when username is invalid', async () => {
      await request(app.getHttpServer())
        .post('/marketplace/creators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          username: 'ab', // Trop court
          displayName: 'Test Creator',
        })
        .expect(400);
    });
  });

  describe('GET /marketplace/creators/:userId', () => {
    it('should return creator profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/marketplace/creators/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('username');
    });

    it('should return 404 when profile does not exist', async () => {
      await request(app.getHttpServer())
        .get('/marketplace/creators/nonexistent-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /marketplace/templates', () => {
    it('should create a marketplace template', async () => {
      const response = await request(app.getHttpServer())
        .post('/marketplace/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          creatorId: userId,
          name: 'Test Template',
          slug: 'test-template',
          promptTemplate: 'A beautiful design with {{variable}}',
          variables: { variable: 'test' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.slug).toBe('test-template');
    });
  });

  describe('GET /marketplace/templates', () => {
    it('should return list of templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/marketplace/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should filter templates by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/marketplace/templates?category=design')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('templates');
    });
  });
});
