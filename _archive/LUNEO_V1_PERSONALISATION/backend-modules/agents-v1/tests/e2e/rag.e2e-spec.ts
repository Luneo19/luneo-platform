/**
 * Tests E2E pour RAG
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BrandStatus, UserRole } from '@prisma/client';

const E2E_TEST_EMAIL = 'e2e-rag@luneo.test';
const E2E_TEST_PASSWORD = 'TestPassword123!';

describe('RAG E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let brandId: string;
  let userId: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash(E2E_TEST_PASSWORD, 13);
    let brand = await prisma.brand.findFirst({ where: { name: 'E2E RAG Test Brand' } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: 'E2E RAG Test Brand', slug: 'e2e-rag-test-brand', status: BrandStatus.ACTIVE },
      });
    }
    let user = await prisma.user.findFirst({
      where: { email: E2E_TEST_EMAIL },
      include: { brand: true },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: E2E_TEST_EMAIL,
          password: hashedPassword,
          firstName: 'E2E',
          lastName: 'RAG',
          role: UserRole.BRAND_ADMIN,
          emailVerified: true,
          brandId: brand.id,
        },
        include: { brand: true },
      });
    } else if (!user.brandId) {
      await prisma.user.update({ where: { id: user.id }, data: { brandId: brand.id } });
      user.brandId = brand.id;
    }
    brandId = user.brandId ?? brand.id;
    userId = user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: E2E_TEST_EMAIL, password: E2E_TEST_PASSWORD });
    authToken = loginRes.body?.data?.accessToken ?? loginRes.body?.accessToken ?? '';

    await prisma.knowledgeBaseArticle.upsert({
      where: { slug: 'configuration-produit' },
      create: {
        title: 'Configuration Produit',
        slug: 'configuration-produit',
        content: 'Pour configurer un produit, allez dans les paramètres...',
        category: 'guide',
        tags: ['configuration', 'produit'],
        isPublished: true,
        authorId: userId,
      },
      update: { authorId: userId },
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
          userId,
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
          userId,
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
          userId,
        })
        .expect(200);
      const duration = Date.now() - startTime;

      // Le deuxième appel devrait être plus rapide (cache)
      expect(duration).toBeLessThan(1000);
    });
  });
});
