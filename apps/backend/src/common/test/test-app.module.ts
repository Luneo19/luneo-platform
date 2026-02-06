/**
 * Module de test pour les tests d'intégration
 * Override les services qui nécessitent une infrastructure externe
 */

import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { AppModule } from '@/app.module';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { SlidingWindowRateLimitService } from '@/libs/rate-limit/sliding-window.service';
import { EmailService } from '@/modules/email/email.service';
import { BruteForceService } from '@/modules/auth/services/brute-force.service';
import { MockRedisOptimizedService } from './mocks/redis.mock';
import { MockSlidingWindowRateLimitService } from './mocks/rate-limit.mock';
import { MockEmailService } from './mocks/email.mock';
import { MockBullQueue } from './mocks/bull.mock';
import { MockBruteForceService } from './mocks/brute-force.mock';

// Liste des queues utilisées dans l'application
const QUEUE_NAMES = [
  'email',
  'generation',
  'analytics-aggregation',
  'reports-generation',
  'notifications',
  'webhooks',
];

/**
 * Crée un module de test avec tous les mocks nécessaires
 */
export async function createIntegrationTestModule(): Promise<TestingModuleBuilder> {
  // S'assurer que les variables d'environnement de test sont configurées
  process.env.NODE_ENV = 'test';
  process.env.DISABLE_BULL = 'true';
  
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Override Redis
  moduleBuilder.overrideProvider(RedisOptimizedService).useClass(MockRedisOptimizedService);
  
  // Override Rate Limiting
  moduleBuilder.overrideProvider(SlidingWindowRateLimitService).useClass(MockSlidingWindowRateLimitService);
  
  // Override Email Service
  moduleBuilder.overrideProvider(EmailService).useClass(MockEmailService);
  
  // Override Brute Force Service
  moduleBuilder.overrideProvider(BruteForceService).useClass(MockBruteForceService);

  // Override toutes les queues Bull
  for (const queueName of QUEUE_NAMES) {
    moduleBuilder.overrideProvider(getQueueToken(queueName)).useValue(new MockBullQueue());
  }

  return moduleBuilder;
}

/**
 * Crée et initialise une application de test complète
 */
export async function createIntegrationTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  const moduleBuilder = await createIntegrationTestModule();
  const moduleFixture = await moduleBuilder.compile();

  const app = moduleFixture.createNestApplication();

  // Configure like main.ts
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();

  return { app, moduleFixture };
}

/**
 * Ferme proprement l'application de test
 */
export async function closeIntegrationTestApp(app: INestApplication | null): Promise<void> {
  if (app) {
    await app.close();
  }
}
