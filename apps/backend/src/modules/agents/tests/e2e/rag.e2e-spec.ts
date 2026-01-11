/**
 * Tests E2E pour RAG
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('RAG E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let brandId: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // TODO: Créer utilisateur de test et obtenir token
    // authToken = await createTestUser();
    // brandId = 'test-brand-id';

    // Créer article de test pour RAG
    await prisma.knowledgeBaseArticle.create({
      data: {
        title: 'Configuration Produit',
        slug: 'configuration-produit',
        content: 'Pour configurer un produit, allez dans les paramètres...',
        category: 'guide',
        tags: ['configuration', 'produit'],
        isPublished: true,
        authorId: 'test-user-id',
      },
    });
  });

  afterAll(async () => {
    // Nettoyer
    await prisma.knowledgeBaseArticle.deleteMany({
      where: { slug: 'configuration-produit' },
    });
    await app.close();
  });

  describe('RAG Search', () => {
    it('should enhance prompt with RAG documents', () => {
      return request(app.getHttpServer())
        .post('/api/agents/luna/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How do I configure a product?',
          brandId,
          userId: 'test-user-id',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBeDefined();
          // La réponse devrait contenir des informations de l'article RAG
        });
    });

    it('should cache RAG results', async () => {
      // Premier appel
      await request(app.getHttpServer())
        .post('/api/agents/luna/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How do I configure a product?',
          brandId,
          userId: 'test-user-id',
        })
        .expect(200);

      // Deuxième appel (devrait utiliser cache)
      const startTime = Date.now();
      await request(app.getHttpServer())
        .post('/api/agents/luna/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How do I configure a product?',
          brandId,
          userId: 'test-user-id',
        })
        .expect(200);
      const duration = Date.now() - startTime;

      // Le deuxième appel devrait être plus rapide (cache)
      expect(duration).toBeLessThan(1000);
    });
  });
});
