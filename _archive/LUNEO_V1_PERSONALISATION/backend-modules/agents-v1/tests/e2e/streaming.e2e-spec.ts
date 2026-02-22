/**
 * Tests E2E pour Streaming SSE
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BrandStatus, UserRole } from '@prisma/client';

const E2E_TEST_EMAIL = 'e2e-streaming@luneo.test';
const E2E_TEST_PASSWORD = 'TestPassword123!';

async function setupTestUser(moduleFixture: TestingModule): Promise<{ authToken: string; brandId: string }> {
  const prisma = moduleFixture.get<PrismaService>(PrismaService);
  const hashedPassword = await bcrypt.hash(E2E_TEST_PASSWORD, 13);
  let brand = await prisma.brand.findFirst({ where: { name: 'E2E Streaming Test Brand' } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: { name: 'E2E Streaming Test Brand', slug: 'e2e-streaming-test-brand', status: BrandStatus.ACTIVE },
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
        lastName: 'Streaming',
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
  return { authToken: '', brandId: user.brandId ?? brand.id };
}

describe('Streaming SSE E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let _brandId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const { brandId: bid } = await setupTestUser(moduleFixture);
    _brandId = bid;
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: E2E_TEST_EMAIL, password: E2E_TEST_PASSWORD });
    authToken = loginRes.body?.data?.accessToken ?? loginRes.body?.accessToken ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Luna Streaming', () => {
    it('should stream response chunks', (done) => {
      const _url = `http://localhost:${app.getHttpServer().address().port}/api/agents/luna/chat/stream?message=Hello`;
      
      request(app.getHttpServer())
        .get('/api/agents/luna/chat/stream')
        .query({ message: 'Hello' })
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'text/event-stream')
        .expect(200)
        .expect('Content-Type', /text\/event-stream/)
        .end((err, res) => {
          if (err) return done(err);
          
          const chunks = res.text.split('\n\n').filter(Boolean);
          expect(chunks.length).toBeGreaterThan(0);
          
          // Vérifier format SSE
          chunks.forEach((chunk) => {
            if (chunk.startsWith('data:')) {
              const data = JSON.parse(chunk.slice(5).trim());
              expect(data).toHaveProperty('content');
            }
          });
          
          done();
        });
    });

    it('should send done event at end', (done) => {
      request(app.getHttpServer())
        .get('/api/agents/luna/chat/stream')
        .query({ message: 'Test' })
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'text/event-stream')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const chunks = res.text.split('\n\n');
          const lastChunk = chunks[chunks.length - 1];
          
          if (lastChunk.includes('data:')) {
            const data = JSON.parse(lastChunk.split('data:')[1].trim());
            expect(data.done).toBe(true);
          }
          
          done();
        });
    });
  });
});
