/**
 * Helper pour créer une application NestJS de test
 * avec toute la configuration nécessaire
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';

export interface TestAppContext {
  app: INestApplication;
  moduleFixture: TestingModule;
}

/**
 * Crée et configure une application NestJS pour les tests d'intégration
 */
export async function createTestApp(): Promise<TestAppContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Configure global prefix like in main.ts
  app.setGlobalPrefix('/api/v1');

  // Configure validation pipe
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
export async function closeTestApp(app: INestApplication | null): Promise<void> {
  if (app) {
    await app.close();
  }
}
