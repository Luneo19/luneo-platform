/**
 * Module de test minimal pour les tests d'authentification
 * N'importe que les modules strictement nécessaires
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { AppModule } from '@/app.module';

// Mocks
import { MockRedisOptimizedService } from './mocks/redis.mock';
import { MockSlidingWindowRateLimitService } from './mocks/rate-limit.mock';
import { MockEmailService } from './mocks/email.mock';
import { MockBruteForceService } from './mocks/brute-force.mock';

// Services réels à remplacer
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { SlidingWindowRateLimitService } from '@/libs/rate-limit/sliding-window.service';
import { EmailService } from '@/modules/email/email.service';
import { BruteForceService } from '@/modules/auth/services/brute-force.service';

/**
 * Crée une application de test pour l'authentification
 */
export async function createAuthTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  // S'assurer que l'environnement est configuré
  process.env.NODE_ENV = 'test';
  process.env.DISABLE_BULL = 'true';
  process.env.SKIP_EMAIL_VERIFICATION = 'true';

  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Override TOUS les services qui utilisent Redis
  moduleBuilder.overrideProvider(RedisOptimizedService).useClass(MockRedisOptimizedService);
  moduleBuilder.overrideProvider(SlidingWindowRateLimitService).useClass(MockSlidingWindowRateLimitService);
  moduleBuilder.overrideProvider(EmailService).useClass(MockEmailService);
  moduleBuilder.overrideProvider(BruteForceService).useClass(MockBruteForceService);

  const moduleFixture = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // Configuration comme main.ts
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
 * Ferme l'application de test
 */
export async function closeAuthTestApp(app: INestApplication | null): Promise<void> {
  if (app) {
    await app.close();
  }
}
