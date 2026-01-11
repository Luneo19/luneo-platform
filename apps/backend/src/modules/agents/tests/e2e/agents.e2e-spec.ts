/**
 * Tests E2E pour Agents IA
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Agents E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let brandId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // TODO: Créer utilisateur de test et obtenir token
    // authToken = await createTestUser();
    // brandId = 'test-brand-id';
    // userId = 'test-user-id';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Luna Agent', () => {
    it('should chat with Luna', () => {
      return request(app.getHttpServer())
        .post('/api/agents/luna/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What are my sales?',
          brandId,
          userId,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBeDefined();
        });
    });

    it('should get conversations', () => {
      return request(app.getHttpServer())
        .get('/api/agents/luna/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should execute action', () => {
      return request(app.getHttpServer())
        .post('/api/agents/luna/action')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action: {
            type: 'generate_report',
            label: 'Generate Report',
            payload: {},
            requiresConfirmation: false,
          },
        })
        .expect(200);
    });
  });

  describe('Aria Agent', () => {
    it('should chat with Aria', () => {
      return request(app.getHttpServer())
        .post('/api/agents/aria/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Improve this text',
          brandId,
          userId,
        })
        .expect(200);
    });

    it('should get quick suggestions', () => {
      return request(app.getHttpServer())
        .post('/api/agents/aria/quick-suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: 'product page',
          brandId,
        })
        .expect(200);
    });
  });

  describe('Nova Agent', () => {
    it('should chat with Nova', () => {
      return request(app.getHttpServer())
        .post('/api/agents/nova/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'How do I configure a product?',
          brandId,
        })
        .expect(200);
    });

    it('should search FAQ', () => {
      return request(app.getHttpServer())
        .get('/api/agents/nova/faq?query=configuration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Envoyer 35 requêtes rapidement
      const requests = Array.from({ length: 35 }, () =>
        request(app.getHttpServer())
          .post('/api/agents/luna/chat')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: 'test',
            brandId,
            userId,
          }),
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((res) => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Streaming SSE', () => {
    it('should stream response', (done) => {
      request(app.getHttpServer())
        .get('/api/agents/luna/chat/stream?message=Hello')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'text/event-stream')
        .expect(200)
        .expect('Content-Type', /text\/event-stream/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).toContain('data:');
          done();
        });
    });
  });
});
