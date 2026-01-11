// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
try {
  require("./instrument");
} catch (error) {
  // Continue anyway if instrument fails
}

import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';

// Log très tôt pour confirmer que le fichier est chargé
const earlyLogger = new Logger('MainBootstrap');
earlyLogger.log('Starting main.ts...');
earlyLogger.debug(`NODE_ENV: ${process.env.NODE_ENV}`);
earlyLogger.debug(`PORT: ${process.env.PORT}`);
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { setupSwagger } from './swagger';
const express = require('express');
import * as Express from 'express';
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
    
    // Note: User.name has been removed from schema.prisma as it's not used
    // and doesn't exist in the database. Prisma Client will be regenerated during build.
    
    // Then run Prisma migrations
    execSync('pnpm prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env, PATH: process.env.PATH },
      cwd: backendDir
    });
    logger.log('Database migrations completed');
  } catch (error: any) {
    logger.warn(`Database migration failed: ${error.message}. Continuing anyway...`);
    // Continue even if migrations fail (might be already up to date or DATABASE_URL not configured)
  }

  try {
    logger.log('Creating Express server...');
    const server = express();
    
    // Parse JSON and URL-encoded bodies FIRST (before NestJS)
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    
    // Parse cookies (required for httpOnly cookies)
    const cookieParser = require('cookie-parser');
    server.use(cookieParser());
    
    logger.log('Creating NestJS application with ExpressAdapter...');
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      bodyParser: false, // We'll handle body parsing manually
    });
    const configService = app.get(ConfigService);
    logger.log('NestJS application created');
    
    // Security middleware - production ready configuration
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));
    logger.log('Security middleware configured');
    
    // Enable compression and security middleware in production
    if (configService.get('app.nodeEnv') === 'production') {
      app.use(compression());
      app.use(hpp());

      // Rate limiting for production (skip health checks)
    const limiter = rateLimit({
      windowMs: configService.get('app.rateLimitTtl') * 1000,
      max: configService.get('app.rateLimitLimit'),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/v1/health';
      },
    });

    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 100, // Allow 100 requests per 15 minutes, then...
      delayMs: () => 500, // Begin adding 500ms of delay per request above 100
      skip: (req) => {
        // Skip speed limiting for health checks
        return req.path === '/health' || req.path === '/api/v1/health';
      },
    });

      app.use(limiter);
      app.use(speedLimiter);
    }

  // CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Global prefix - set prefix for all routes
  // IMPORTANT: setGlobalPrefix must be called BEFORE app.init()
  // This ensures all controllers are registered with the correct prefix
  const apiPrefix = configService.get('app.apiPrefix') || '/api/v1';
  app.setGlobalPrefix(apiPrefix);
  logger.log(`✅ Global prefix set to: ${apiPrefix}`);

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

  // CRITICAL: Register /health route BEFORE app.init()
  // This is the EXACT pattern from serverless.ts which works correctly on Vercel
  // The order of middleware registration is critical: /health must be registered
  // BEFORE NestJS adds its routing middleware during app.init()
  server.get('/health', (req: Express.Request, res: Express.Response) => {
    logger.log(`[HEALTH] Health check endpoint called - path: ${req.path}, url: ${req.url}, originalUrl: ${req.originalUrl}`);
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'luneo-backend',
      version: process.env.npm_package_version || '1.0.0',
    });
  });
  logger.log('Health check route registered at /health (BEFORE app.init() on Express server)');

  // Initialize NestJS application (this registers all routes)
  await app.init();
  
  // Railway provides PORT automatically - use it directly
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : (configService.get('app.port') || 3000);
  
  logger.log(`Starting NestJS application on port ${port}...`);
  logger.log(`Environment: PORT=${process.env.PORT}, NODE_ENV=${process.env.NODE_ENV}`);
  
  // CRITICAL: Use app.listen() instead of server.listen()
  // app.listen() ensures NestJS properly registers all routes on the Express server
  // The ExpressAdapter connects NestJS to the Express server, but app.listen() is required
  // to properly initialize and register all routes
  await app.listen(port, '0.0.0.0');
  
  const apiPrefixFinal = configService.get('app.apiPrefix');
  logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  logger.log(`📚 Swagger documentation: http://0.0.0.0:${port}${apiPrefixFinal}/docs`);
  logger.log(`🔍 Health check: http://0.0.0.0:${port}/health`);
  logger.log(`🔍 API Health check: http://0.0.0.0:${port}${apiPrefixFinal}/health`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    throw error;
  }
}

// Log avant bootstrap
earlyLogger.log('About to call bootstrap()...');

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application', error instanceof Error ? error.stack : String(error));
  // Don't exit immediately, let Railway see the error
  setTimeout(() => process.exit(1), 5000);
});
