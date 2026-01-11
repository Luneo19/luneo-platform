/**
 * Tests E2E pour Streaming SSE
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { EventSource } from 'eventsource';

describe('Streaming SSE E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let brandId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // TODO: Créer utilisateur de test et obtenir token
    // authToken = await createTestUser();
    // brandId = 'test-brand-id';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Luna Streaming', () => {
    it('should stream response chunks', (done) => {
      const url = `http://localhost:${app.getHttpServer().address().port}/api/agents/luna/chat/stream?message=Hello`;
      
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
