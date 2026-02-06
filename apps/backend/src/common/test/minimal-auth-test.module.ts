/**
 * Module de test minimal pour les tests d'authentification
 * Assemble manuellement les modules nécessaires avec les mocks
 */

import { Module, Global } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CryptoModule } from '@/libs/crypto/crypto.module';

// Auth module components (we'll import individually)
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { TwoFactorService } from '@/modules/auth/services/two-factor.service';
import { CaptchaService } from '@/modules/auth/services/captcha.service';

// Configuration
import { appConfig, databaseConfig, jwtConfig } from '@/config/configuration';

// Mocks
import { MockRedisOptimizedService } from './mocks/redis.mock';
import { MockBruteForceService } from './mocks/brute-force.mock';
import { MockEmailService } from './mocks/email.mock';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { BruteForceService } from '@/modules/auth/services/brute-force.service';
import { EmailService } from '@/modules/email/email.service';

/**
 * Module global qui fournit les mocks
 */
@Global()
@Module({
  providers: [
    {
      provide: RedisOptimizedService,
      useClass: MockRedisOptimizedService,
    },
    {
      provide: BruteForceService,
      useClass: MockBruteForceService,
    },
    {
      provide: EmailService,
      useClass: MockEmailService,
    },
  ],
  exports: [RedisOptimizedService, BruteForceService, EmailService],
})
class MocksModule {}

/**
 * Module Auth minimal avec les mocks
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env.test',
    }),
    EventEmitterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret') || 'test-secret-key-minimum-32-chars!!',
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    CryptoModule,
    MocksModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TwoFactorService,
    CaptchaService,
  ],
})
export class MinimalAuthTestModule {}

/**
 * Crée une application de test minimale pour l'authentification
 */
export async function createMinimalAuthTestApp(): Promise<{
  app: INestApplication;
  moduleFixture: TestingModule;
}> {
  // S'assurer que l'environnement est configuré
  process.env.NODE_ENV = 'test';
  process.env.SKIP_EMAIL_VERIFICATION = 'true';

  const moduleFixture = await Test.createTestingModule({
    imports: [MinimalAuthTestModule],
  }).compile();

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
export async function closeMinimalAuthTestApp(app: INestApplication | null): Promise<void> {
  if (app) {
    await app.close();
  }
}
