// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("./instrument");
} catch {
  // Continue anyway if instrument fails
}

import { Logger, ValidationPipe } from '@nestjs/common';

// Log très tôt pour confirmer que le fichier est chargé
const earlyLogger = new Logger('MainBootstrap');
earlyLogger.log('Starting main.ts...');
earlyLogger.debug(`NODE_ENV: ${process.env.NODE_ENV}`);
earlyLogger.debug(`PORT: ${process.env.PORT}`);
process.on('uncaughtException', (error) => {
  // Keep this at process-level to surface startup crashes in container logs.
  earlyLogger.error(`Uncaught exception during bootstrap: ${error?.message ?? error}`, error?.stack);
});
process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  earlyLogger.error(`Unhandled rejection during bootstrap: ${message}`, stack);
});
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { setupSwagger } from './swagger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
import type { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hpp = require('hpp');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
import { randomUUID } from 'crypto';
import { csrfTokenMiddleware } from './common/middleware/csrf-token.middleware';
import { winstonLogger } from './config/logger.config';

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

let appReady = false;

async function bootstrap() {
  validateRequiredEnvVars();

  // OpenTelemetry tracing (before Nest bootstrap, when MONITORING_OPENTELEMETRY_ENDPOINT is set)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initTracing } = require('./libs/tracing/otel.config');
    initTracing();
  } catch {
    // Optional: otel.config or deps may be missing
  }

  const logger = new Logger('Bootstrap');

  // Log immédiatement pour confirmer que bootstrap() est appelé
  logger.log('🚀 Bootstrap function called');
  logger.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
  
  try {
    // SVC-04: Validate environment variables at startup
    // This will throw in production if critical variables are missing
    validateEnv();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV === 'production') {
      // En production, arrêter immédiatement si variables critiques manquantes
      logger.error(`🚨 FATAL: ${message}`);
      logger.error('L\'application ne peut pas démarrer sans les variables critiques.');
      process.exit(1);
    } else {
      // En développement, continuer avec un warning
      logger.warn(`⚠️ Environment validation warning: ${message}`);
      logger.warn('Continuing in development mode with partial configuration...');
    }
  }

  // NOTE: Database migrations are handled by start.sh (or Dockerfile CMD) BEFORE
  // the application starts. Do NOT run migrations here to avoid double-run conflicts.
  // See: Dockerfile -> start.sh -> prisma migrate deploy

  // Run database seed only when RUN_SEED=true (e.g. first deploy) or in development
  // In production, seed should be run explicitly via a separate command, not on every startup
  const shouldSeed = process.env.RUN_SEED === 'true' || process.env.NODE_ENV !== 'production';
  if (shouldSeed) {
  try {
    logger.log('Running database seed...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
    logger.log('Database seed completed successfully');
  } catch (seedError: unknown) {
    const err = seedError as { stderr?: { toString(): string }; stdout?: { toString(): string }; message?: string };
    const seedErrorOutput = err.stderr?.toString() || err.stdout?.toString() || (err.message ?? '') || '';
    
    // If seed script fails, try to create admin directly via Prisma
    logger.warn(`⚠️ Database seed script failed: ${seedErrorOutput.substring(0, 500)}`);
    logger.warn('⚠️ Attempting to create admin user directly...');
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require('@prisma/client');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bcrypt = require('bcryptjs');
      const tempPrisma = new PrismaClient();
      
      const defaultAdminPw = process.env.ADMIN_DEFAULT_PASSWORD;
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!defaultAdminPw && process.env.NODE_ENV === 'production') {
        logger.warn('ADMIN_DEFAULT_PASSWORD not set — skipping admin creation in production');
        throw new Error('Cannot create admin without ADMIN_DEFAULT_PASSWORD in production');
      }
      if (!adminEmail && process.env.NODE_ENV === 'production') {
        logger.warn('ADMIN_EMAIL not set — skipping admin creation in production');
        throw new Error('Cannot create admin without ADMIN_EMAIL in production');
      }
      const finalAdminEmail = adminEmail || 'admin@localhost.dev';
      // In production: use ADMIN_DEFAULT_PASSWORD. In dev: use env var or a secure random password
      let passwordToHash = defaultAdminPw;
      if (!passwordToHash) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const crypto = require('crypto');
        passwordToHash = crypto.randomBytes(16).toString('hex');
        // SECURITY FIX: Removed admin password from logs (MED-004)
        // logger.warn(`DEV ONLY: Generated random admin password: ${passwordToHash}`);
      }
      const adminPassword = await bcrypt.hash(passwordToHash, 13);
      const adminUser = await tempPrisma.user.upsert({
        where: { email: finalAdminEmail },
        update: {},
        create: {
          email: finalAdminEmail,
          passwordHash: adminPassword,
          firstName: 'Admin',
          lastName: 'Luneo',
          role: 'ADMIN',
          emailVerified: true,
        },
      });
      
      logger.log(`✅ Admin user created directly: ${adminUser.email}`);
      await tempPrisma.$disconnect();
    } catch (directAdminError: unknown) {
      const msg = directAdminError instanceof Error ? directAdminError.message : String(directAdminError);
      logger.error(`Failed to create admin directly: ${msg.substring(0, 300)}`);
      logger.warn('Admin user may already exist or database connection failed');
    }
  }
  } else {
    logger.log('Skipping database seed in production (set RUN_SEED=true to force)');
  }

  try {
    logger.log('Creating Express server...');
    const server = express();
    
    // Trust proxy for Railway/behind reverse proxy (required for express-rate-limit)
    // Use 1 instead of true to trust only the first proxy (Railway's load balancer)
    // This prevents the ERR_ERL_PERMISSIVE_TRUST_PROXY warning
    server.set('trust proxy', 1);
    
    // Preserve raw body for webhook signature verification
    // This must be done BEFORE NestJS/JSON body parsing
    // Stripe webhook
    server.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));
    // SendGrid event webhook (raw body for signature verification)
    server.use('/api/v1/webhooks/sendgrid/events', express.raw({ type: 'application/json' }));
    // WooCommerce webhook (raw body for HMAC verification)
    server.use('/api/v1/ecommerce/woocommerce/webhook', express.raw({ type: 'application/json' }));
    // Shopify webhooks (raw body for HMAC-SHA256 verification)
    server.use('/api/v1/integrations/shopify/webhooks', express.raw({ type: 'application/json' }));

    // Parse JSON and URL-encoded bodies for all other routes
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    
    server.use(cookieParser());
    server.use(csrfTokenMiddleware);
    
    server.use((req: Request, res: Response, next: NextFunction) => {
      const correlationId = req.headers['x-request-id'] || randomUUID();
      req.headers['x-request-id'] = correlationId;
      res.setHeader('X-Request-Id', correlationId);
      next();
    });
    
    logger.log('Creating NestJS application with ExpressAdapter...');
    
    const WinstonLogger = {
      log: (message: string) => winstonLogger.info(message),
      error: (message: string, trace?: string) => winstonLogger.error(message, { trace }),
      warn: (message: string) => winstonLogger.warn(message),
      debug: (message: string) => winstonLogger.debug(message),
      verbose: (message: string) => winstonLogger.verbose(message),
    };
    
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      bodyParser: false, // We'll handle body parsing manually
      logger: process.env.NODE_ENV === 'production' ? WinstonLogger : undefined,
    });
    const configService = app.get(ConfigService);
    logger.log('NestJS application created');

    // Production: require explicit CORS configuration (no wildcard)
    const nodeEnv = configService.get('app.nodeEnv') || 'development';
    const corsOriginFromConfig = configService.get<string>('app.corsOrigin');
    const hasCorsOrigins = process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.trim().length > 0;
    if (
      nodeEnv === 'production' &&
      !hasCorsOrigins &&
      (!corsOriginFromConfig || corsOriginFromConfig === '*')
    ) {
      logger.error('FATAL: CORS_ORIGIN or CORS_ORIGINS must be explicitly configured in production (cannot be undefined or *)');
      throw new Error('CORS_ORIGIN or CORS_ORIGINS must be explicitly configured in production.');
    }
    
    // CORS - Configuration sécurisée avec liste d'origines explicites
    // IMPORTANT: Ne JAMAIS utiliser '*' en production avec credentials
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const corsOriginEnv = configService.get('app.corsOrigin') || '';
    
    // Fallback: origines en dur si CORS_ORIGINS non défini
    const productionOrigins = [
      'https://luneo.app',
      'https://www.luneo.app',
      'https://api.luneo.app',
    ];
    
    // Patterns wildcard (ex: https://frontend-*.vercel.app)
    const originWildcardPatterns = [
      /^https:\/\/frontend-[a-z0-9-]+\.vercel\.app$/,
    ];
    
    const developmentOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Utiliser CORS_ORIGINS si défini, sinon fallback selon l'environnement
    let allowedOrigins: string[] =
      corsOrigins.length > 0
        ? corsOrigins
        : nodeEnv === 'production'
          ? [...productionOrigins]
          : [...productionOrigins, ...developmentOrigins];
    
    if (corsOriginEnv && corsOriginEnv !== '*' && allowedOrigins.length > 0) {
      const envOrigins = corsOriginEnv.split(',').map((o: string) => o.trim()).filter(Boolean);
      allowedOrigins = [...new Set([...allowedOrigins, ...envOrigins])];
    }
    
    const isOriginAllowed = (origin: string | undefined): boolean => {
      if (!origin) return false;
      if (allowedOrigins.includes(origin)) return true;
      return originWildcardPatterns.some((pattern) => pattern.test(origin));
    };
    
    logger.log(`CORS: Environnement ${nodeEnv}, ${allowedOrigins.length} origines autorisées (+ wildcards Vercel)`);
    logger.debug(`CORS Origins: ${allowedOrigins.join(', ')}`);
    
  // Middleware CORS manuel sur Express AVANT tous les autres middlewares NestJS
  server.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): void => {
    const origin = req.headers.origin as string | undefined;
    
    // Vérifier si l'origine est autorisée (liste exacte + patterns wildcard)
    const isAllowed = isOriginAllowed(origin);
    
    if (isAllowed) {
      res.removeHeader('Access-Control-Allow-Origin');
      res.setHeader('Access-Control-Allow-Origin', origin!);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      // PRODUCTION FIX: Added X-CSRF-Token for CSRF protection
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key, X-Request-Time, x-request-time, X-Request-Id, X-CSRF-Token, x-csrf-token');
      res.setHeader('Access-Control-Max-Age', '86400');
    } else if (origin && nodeEnv === 'production') {
      // Logger les tentatives d'accès non autorisées en production
      logger.warn(`CORS: Origine non autorisée bloquée: ${origin}`);
    }
    
    // Gérer les requêtes OPTIONS (preflight) - répondre AVANT NestJS
    if (req.method === 'OPTIONS') {
      if (isAllowed) {
        res.status(204).end();
      } else if (!origin) {
        // Pas d'Origin (proxy, outil) : répondre 204 pour ne pas bloquer à tort
        res.status(204).end();
      } else {
        res.status(403).json({ error: 'CORS origin not allowed' });
      }
      return;
    }
    
    next();
  });
    
    // Security middleware - production ready configuration
    // SECURITY FIX: Hardened CSP - restricted wildcards, removed unsafe-inline where possible
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Styles: unsafe-inline needed for many UI frameworks; restrict to self + trusted CDNs
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          // SECURITY FIX: Restrict imgSrc to known domains instead of wildcard https:
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://cdn.luneo.app', 'https://lh3.googleusercontent.com', 'https://avatars.githubusercontent.com'],
          // SECURITY FIX: Restrict connectSrc to known API domains instead of wildcard https:
          connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.openai.com', 'https://api.cloudinary.com', 'https://api.luneo.app', 'https://luneo.app'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      // SECURITY FIX: Explicit security headers
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xContentTypeOptions: true, // nosniff
      xFrameOptions: { action: 'deny' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }));

    // SECURITY FIX: Permissions-Policy header - restrict browser features
    app.use((_req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
      res.setHeader('Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(self), ' +
        'usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ' +
        'autoplay=(), encrypted-media=(self), fullscreen=(self), ' +
        'picture-in-picture=(self), interest-cohort=()'
      );
      next();
    });
    logger.log('Security middleware configured');

    // Compression for all environments (reduces response size)
    app.use(compression());

    // ETags for conditional GET / cache validation
    app.getHttpAdapter().getInstance().set('etag', 'strong');
    
    // Additional security middleware in production
    if (configService.get('app.nodeEnv') === 'production') {
      app.use(hpp());

      // SECURITY FIX: Force HTTPS redirect in production
      app.use((req: { headers: Record<string, string>; url: string }, res: { redirect: (status: number, url: string) => void }, next: () => void) => {
        if (req.headers['x-forwarded-proto'] !== 'https' && !req.url.startsWith('/health')) {
          res.redirect(301, `https://${req.headers.host}${req.url}`);
          return;
        }
        next();
      });

      // RATE LIMIT FIX P3-12: Express-level rateLimit and slowDown removed.
      // Rate limiting is now handled exclusively by NestJS ThrottlerModule + GlobalRateLimitGuard,
      // which provides Redis-backed distributed rate limiting and per-endpoint control via @RateLimit().
      // Having both Express and NestJS rate limiters caused redundant 429 responses.
      // Webhook paths are skipped in GlobalRateLimitGuard (billing, woocommerce, shopify).
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
  server.get('/health', (_req: Request, res: Response) => {
    if (!appReady) {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'luneo-backend',
        version: process.env.npm_package_version || '1.0.0',
      });
      return;
    }

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
  
  // Enable graceful shutdown hooks (SIGTERM/SIGINT) so in-flight requests
  // complete before the process exits during deployments.
  app.enableShutdownHooks();

  // CRITICAL: Use app.listen() instead of server.listen()
  // app.listen() ensures NestJS properly registers all routes on the Express server
  // The ExpressAdapter connects NestJS to the Express server, but app.listen() is required
  // to properly initialize and register all routes
  await app.listen(port, '0.0.0.0');
  appReady = true;
  
  const apiPrefixFinal = configService.get('app.apiPrefix');
  logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  logger.log(`📚 Swagger documentation: http://0.0.0.0:${port}${apiPrefixFinal}/docs`);
  logger.log(`🔍 Health check: http://0.0.0.0:${port}/health`);
  logger.log(`🔍 API Health check: http://0.0.0.0:${port}${apiPrefixFinal}/health`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error(`Failed to start application: ${msg}`, stack);
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
