// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
import "./instrument";

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
// import compression from 'compression';
// import hpp from 'hpp';
// import rateLimit from 'express-rate-limit';
// import slowDown from 'express-slow-down';

import { AppModule } from './app.module';
import { validateEnv } from './config/configuration';
import { initializeTracing, shutdownTracing } from './modules/observability/tracing';

async function bootstrap() {
  // Validate environment variables
  validateEnv();
  await initializeTracing();

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const apiPrefix = configService.get<string>('app.apiPrefix') ?? '/api/v1';
  app.use(`${apiPrefix}/billing/webhook`, bodyParser.raw({ type: 'application/json' }));
  app.use(`${apiPrefix}/shopify/webhooks`, bodyParser.raw({ type: 'application/json' }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Security middleware - production ready
  const isProd = configService.get('app.nodeEnv') === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
              connectSrc: ["'self'", 'https://api.stripe.com', 'https://*.upstash.io'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              frameSrc: ["'self'", 'https://js.stripe.com'],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: isProd
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    }),
  );
  
  // Enable compression and security middleware in production
  if (isProd) {
    const compression = require('compression');
    const hpp = require('hpp');
    const rateLimit = require('express-rate-limit');
    const slowDown = require('express-slow-down');
    
    app.use(compression());
    app.use(hpp());

    // Rate limiting for production
    const limiter = rateLimit({
      windowMs: configService.get('app.rateLimitTtl') * 1000,
      max: configService.get('app.rateLimitLimit'),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 100, // Allow 100 requests per 15 minutes, then...
      delayMs: () => 500, // Begin adding 500ms of delay per request above 100
    });

    app.use(limiter);
    app.use(speedLimiter);
  }

  // CORS
  const corsOrigin = configService.get<string>('app.corsOrigin') ?? '*';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe
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

  // Swagger documentation
  if (configService.get('app.nodeEnv') !== 'production') {
    setupSwagger(app);
  }

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔍 Health check: http://localhost:${port}/health`);
}

bootstrap().catch(async (error) => {
  console.error('❌ Failed to start application:', error);
  await shutdownTracing();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await shutdownTracing();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownTracing();
  process.exit(0);
});
