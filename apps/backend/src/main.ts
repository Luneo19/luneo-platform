// Log très tôt pour confirmer que le fichier est chargé
console.log('[MAIN] Starting main.ts...');
console.log('[MAIN] NODE_ENV:', process.env.NODE_ENV);
console.log('[MAIN] PORT:', process.env.PORT);

// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
try {
  require("./instrument");
  console.log('[MAIN] Instrument loaded successfully');
} catch (error) {
  console.error('[MAIN] Failed to load instrument:', error);
  // Continue anyway
}

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { setupSwagger } from './swagger';
const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const hpp = require('hpp');

import { AppModule } from './app.module';
import { validateEnv } from './config/configuration';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Log immédiatement pour confirmer que bootstrap() est appelé
  logger.log('🚀 Bootstrap function called');
  logger.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
  
  try {
    // Validate environment variables
    logger.log('Validating environment variables...');
    validateEnv();
    logger.log('Environment variables validated');
  } catch (error) {
    logger.warn(`Environment validation failed: ${error.message}. Some variables may be missing.`);
    // Continue anyway - some variables are optional
    if (!process.env.DATABASE_URL) {
      logger.warn('DATABASE_URL not configured. Database features will be unavailable.');
    }
  }

  // Run database migrations before starting the application
  try {
    logger.log('Running database migrations...');
    const { execSync } = require('child_process');
    const path = require('path');
    // Utiliser le répertoire du backend pour Prisma
    const backendDir = path.join(__dirname, '../..');
    execSync('pnpm prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env, PATH: process.env.PATH },
      cwd: backendDir
    });
    logger.log('Database migrations completed');
  } catch (error) {
    logger.warn(`Database migration failed: ${error.message}. Continuing anyway...`);
    // Continue even if migrations fail (might be already up to date or DATABASE_URL not configured)
  }

  try {
    logger.log('Creating Express server...');
    const server = express();
    
    logger.log('Creating NestJS application with ExpressAdapter...');
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      bodyParser: false, // We'll handle body parsing manually
    });
    const configService = app.get(ConfigService);
    logger.log('NestJS application created');
    
    // Parse JSON and URL-encoded bodies
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    
    // Security middleware - production ready
    app.use(helmet());
    logger.log('Security middleware configured');
    
    // Enable compression and security middleware in production
    if (configService.get('app.nodeEnv') === 'production') {
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

  // Global prefix - exclude 'health' from prefix so /health works directly
  app.setGlobalPrefix(configService.get('app.apiPrefix'), {
    exclude: ['health'],
  });
  
  const apiPrefix = configService.get('app.apiPrefix');
  logger.log(`✅ Health endpoints available:`);
  logger.log(`   - /health (simple, for Railway health checks)`);
  logger.log(`   - ${apiPrefix}/health (full health check with Terminus - if needed)`);

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

  // Initialize NestJS application (this registers all routes)
  await app.init();
  
  // Railway provides PORT automatically - use it directly
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : (configService.get('app.port') || 3000);
  
  logger.log(`Starting server on port ${port}...`);
  logger.log(`Environment: PORT=${process.env.PORT}, NODE_ENV=${process.env.NODE_ENV}`);
  
  // Use app.listen() - NestJS will use the Express server we created
  await app.listen(port, '0.0.0.0');
    const apiPrefix = configService.get('app.apiPrefix');
    logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
    logger.log(`📚 Swagger documentation: http://0.0.0.0:${port}/api/docs`);
    logger.log(`🔍 Health check: http://0.0.0.0:${port}${apiPrefix}/health`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    throw error;
  }
}

// Log avant bootstrap
console.log('[MAIN] About to call bootstrap()...');

bootstrap().catch((error) => {
  console.error('[MAIN] Bootstrap failed:', error);
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application:', error instanceof Error ? error.stack : String(error));
  // Don't exit immediately, let Railway see the error
  setTimeout(() => process.exit(1), 5000);
});
