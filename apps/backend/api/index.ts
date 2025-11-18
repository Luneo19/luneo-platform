// Register tsconfig-paths before any imports
// Use explicit path resolution for Vercel
import { register } from 'tsconfig-paths';
import * as path from 'path';

// On Vercel, the code is in /var/task/, so baseUrl should be /var/task/
// But __dirname in compiled JS will be /var/task/api/, so we go up one level
const baseUrl = path.resolve(__dirname, '..');
register({
  baseUrl,
  paths: {
    '@/*': ['src/*'],
    '@/common/*': ['src/common/*'],
    '@/modules/*': ['src/modules/*'],
    '@/config/*': ['src/config/*'],
    '@/libs/*': ['src/libs/*'],
    '@/jobs/*': ['src/jobs/*'],
  },
  // Add this to help with module resolution
  addMatchAll: false,
});

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { setupSwagger } from '../src/swagger';
import { validateEnv } from '../src/config/configuration';

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const logger = new Logger('Bootstrap');
  
  try {
    // Validate environment variables
    logger.log('Validating environment variables...');
    validateEnv();
    logger.log('Environment variables validated');
  } catch (error) {
    logger.error(`Environment validation failed: ${error.message}`, error.stack);
    throw error;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  const configService = app.get(ConfigService);
  logger.log('NestJS application created');
  
  // Security middleware - production ready
  app.use(helmet());
  logger.log('Security middleware configured');
  
  // Enable compression and security middleware in production
  if (configService.get('app.nodeEnv') === 'production') {
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
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix'));

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

  await app.init();
  logger.log('Application initialized');

  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(req: express.Request, res: express.Response) {
  const app = await createApp();
  return app(req, res);
}

