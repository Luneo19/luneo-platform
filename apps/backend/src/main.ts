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

function validateRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const productionRequired = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SENTRY_DSN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (process.env.NODE_ENV === 'production') {
    missing.push(...productionRequired.filter(key => !process.env[key]));
  }

  if (missing.length > 0) {
    earlyLogger.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function bootstrap() {
  validateRequiredEnvVars();

  const logger = new Logger('Bootstrap');

  // Log immédiatement pour confirmer que bootstrap() est appelé
  logger.log('🚀 Bootstrap function called');
  logger.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
  
  try {
    // SVC-04: Validate environment variables at startup
    // This will throw in production if critical variables are missing
    validateEnv();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      // En production, arrêter immédiatement si variables critiques manquantes
      logger.error(`🚨 FATAL: ${error.message}`);
      logger.error('L\'application ne peut pas démarrer sans les variables critiques.');
      process.exit(1);
    } else {
      // En développement, continuer avec un warning
      logger.warn(`⚠️ Environment validation warning: ${error.message}`);
      logger.warn('Continuing in development mode with partial configuration...');
    }
  }

  // Run database migrations and ensure critical columns (see migration-resolver.ts)
  try {
    logger.log('🔄 Running database migrations...');
    const { runDatabaseMigrations, ensureCriticalColumns } = require('./migration-resolver');
    runDatabaseMigrations(logger);
  } catch (error: any) {
    logger.error(`❌ Database migration failed: ${error.message}`);
    logger.error(`Migration error stack: ${error.stack}`);
    if (process.env.NODE_ENV === 'production') {
      logger.error('⚠️ Continuing despite migration failure (may cause runtime errors)');
    }
  }

  try {
    logger.log('🔧 Verifying critical database columns...');
    const { PrismaClient } = require('@prisma/client');
    const tempPrisma = new PrismaClient();
    const { ensureCriticalColumns } = require('./migration-resolver');
    await ensureCriticalColumns(tempPrisma, logger);
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (columnError: any) {
    logger.warn(`⚠️ Column verification (non-critical): ${columnError.message?.substring(0, 300)}`);
    logger.warn('⚠️ Some columns may be missing - CacheWarmingService may fail');
  }

  // ALWAYS run database seed (at least admin creation), even if migrations failed
  // The admin user is critical for the application to function
  try {
    logger.log('🌱 Running database seed (admin creation is critical)...');
    const { execSync } = require('child_process');
    const path = require('path');
    const backendDir = path.join(__dirname, '../..');
    
    // Use tsx to run the seed script (TypeScript execution)
    const seedCmd = 'npx tsx prisma/seed.ts';
    
    logger.log(`Executing: ${seedCmd} in ${backendDir}`);
    const seedOutput = execSync(seedCmd, {
      stdio: 'pipe',
      env: { ...process.env, PATH: process.env.PATH },
      cwd: backendDir,
      encoding: 'utf8'
    });
    logger.log(seedOutput);
    logger.log('✅ Database seed completed successfully');
  } catch (seedError: any) {
    const seedErrorOutput = seedError.stderr?.toString() || seedError.stdout?.toString() || seedError.message || '';
    
    // If seed script fails, try to create admin directly via Prisma
    logger.warn(`⚠️ Database seed script failed: ${seedErrorOutput.substring(0, 500)}`);
    logger.warn('⚠️ Attempting to create admin user directly...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const bcrypt = require('bcryptjs');
      const tempPrisma = new PrismaClient();
      
      const adminPassword = await bcrypt.hash('admin123', 13);
      const adminUser = await tempPrisma.user.upsert({
        where: { email: 'admin@luneo.com' },
        update: {},
        create: {
          email: 'admin@luneo.com',
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'Luneo',
          role: 'PLATFORM_ADMIN',
          emailVerified: true,
        },
      });
      
      logger.log(`✅ Admin user created directly: ${adminUser.email}`);
      await tempPrisma.$disconnect();
    } catch (directAdminError: any) {
      logger.error(`❌ Failed to create admin directly: ${directAdminError.message?.substring(0, 300)}`);
      logger.warn('⚠️ Admin user may already exist or database connection failed');
    }
  }

  try {
    logger.log('Creating Express server...');
    const server = express();
    
    // Trust proxy for Railway/behind reverse proxy (required for express-rate-limit)
    // Use 1 instead of true to trust only the first proxy (Railway's load balancer)
    // This prevents the ERR_ERL_PERMISSIVE_TRUST_PROXY warning
    server.set('trust proxy', 1);
    
    // Preserve raw body for Stripe webhook signature verification
    // This must be done BEFORE NestJS/JSON body parsing
    server.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));
    server.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
    server.use('/billing/webhook', express.raw({ type: 'application/json' }));
    server.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
    
    // Parse JSON and URL-encoded bodies for all other routes
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
    
    // CORS - Configuration sécurisée avec liste d'origines explicites
    // IMPORTANT: Ne JAMAIS utiliser '*' en production avec credentials
    const corsOriginEnv = configService.get('app.corsOrigin') || '';
    const nodeEnv = configService.get('app.nodeEnv') || 'development';
    
    // Définir les origines autorisées explicitement
    const productionOrigins = [
      'https://app.luneo.app',
      'https://luneo.app',
      'https://www.luneo.app',
      'https://api.luneo.app',
    ];
    
    const developmentOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Combiner les origines selon l'environnement
    let allowedOrigins: string[] = [];
    
    if (nodeEnv === 'production') {
      // En production: origines de production + origines de l'env var (si spécifiées)
      allowedOrigins = [...productionOrigins];
      if (corsOriginEnv && corsOriginEnv !== '*') {
        const envOrigins = corsOriginEnv.split(',').map(o => o.trim()).filter(Boolean);
        allowedOrigins = [...new Set([...allowedOrigins, ...envOrigins])];
      }
    } else {
      // En développement: toutes les origines + origines de l'env var
      allowedOrigins = [...productionOrigins, ...developmentOrigins];
      if (corsOriginEnv && corsOriginEnv !== '*') {
        const envOrigins = corsOriginEnv.split(',').map(o => o.trim()).filter(Boolean);
        allowedOrigins = [...new Set([...allowedOrigins, ...envOrigins])];
      }
    }
    
    logger.log(`CORS: Environnement ${nodeEnv}, ${allowedOrigins.length} origines autorisées`);
    logger.debug(`CORS Origins: ${allowedOrigins.join(', ')}`);
    
  // Middleware CORS manuel sur Express AVANT tous les autres middlewares NestJS
  server.use((req, res, next): void => {
    const origin = req.headers.origin;
    
    // Vérifier si l'origine est autorisée
    const isAllowed = origin && allowedOrigins.includes(origin);
    
    if (isAllowed) {
      res.removeHeader('Access-Control-Allow-Origin');
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-Time, x-request-time, X-Request-Id');
      res.setHeader('Access-Control-Max-Age', '86400');
    } else if (origin && nodeEnv === 'production') {
      // Logger les tentatives d'accès non autorisées en production
      logger.warn(`CORS: Origine non autorisée bloquée: ${origin}`);
    }
    
    // Gérer les requêtes OPTIONS (preflight) - répondre AVANT NestJS
    if (req.method === 'OPTIONS') {
      if (isAllowed) {
        res.status(204).end();
      } else {
        res.status(403).json({ error: 'CORS origin not allowed' });
      }
      return;
    }
    
    next();
  });
    
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

  // IMPORTANT: Ne PAS appeler app.enableCors() car CORS est géré manuellement avec Express
  // Cela évite les conflits et les doublons de headers

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
