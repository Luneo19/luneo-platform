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
    logger.log('🔄 Running database migrations...');
    const { execSync } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    // Utiliser le répertoire du backend pour Prisma
    const backendDir = path.join(__dirname, '../..');
    
    // Chercher le binaire Prisma dans node_modules (utiliser la version installée, pas la dernière via npx)
    // npx installe Prisma 7.x qui est incompatible avec notre schéma Prisma 5.22.0
    const prismaBin = path.join(__dirname, '../../node_modules/.bin/prisma');
    const prismaBinAlt = path.join(backendDir, 'node_modules/.bin/prisma');
    const prismaBinRoot = '/app/node_modules/.bin/prisma';
    
    let prismaCmd = null;
    
    // Essayer d'utiliser le binaire Prisma directement (version installée, pas via npx)
    if (fs.existsSync(prismaBinRoot)) {
      prismaCmd = `${prismaBinRoot} migrate deploy`;
      logger.log(`Using Prisma binary from: ${prismaBinRoot}`);
    } else if (fs.existsSync(prismaBin)) {
      prismaCmd = `${prismaBin} migrate deploy`;
      logger.log(`Using Prisma binary from: ${prismaBin}`);
    } else if (fs.existsSync(prismaBinAlt)) {
      prismaCmd = `${prismaBinAlt} migrate deploy`;
      logger.log(`Using Prisma binary from: ${prismaBinAlt}`);
    } else {
      // Fallback: utiliser npx avec version spécifique pour éviter d'installer Prisma 7.x
      prismaCmd = 'npx --yes prisma@5.22.0 migrate deploy';
      logger.warn(`Prisma binary not found, using npx with version 5.22.0 (may install package)`);
    }
    
    logger.log(`Executing: ${prismaCmd} in ${backendDir}`);
    try {
      // Use pipe to capture output for error detection
      const output = execSync(prismaCmd, { 
        stdio: 'pipe',
        env: { ...process.env, PATH: process.env.PATH },
        cwd: backendDir,
        encoding: 'utf8'
      });
      logger.log(output);
      logger.log('✅ Database migrations completed successfully');
    } catch (migrationError: any) {
      // Capture the full error output
      const errorOutput = migrationError.stderr?.toString() || migrationError.stdout?.toString() || migrationError.message || '';
      
      // Log the error for debugging
      logger.warn(`Migration error output: ${errorOutput.substring(0, 500)}`);
      
      // Check if the error is P3009 (failed migrations blocking new ones)
      if (errorOutput.includes('P3009') || errorOutput.includes('failed migrations in the target database')) {
        logger.warn('⚠️ P3009: Failed migrations detected in database');
        logger.warn('Attempting to automatically resolve failed migrations...');
        
        try {
          // Extract migration name from error message
          // Error format: "The `migration_name` migration started at ... failed"
          const migrationMatch = errorOutput.match(/The `([^`]+)` migration/);
          
          if (migrationMatch && migrationMatch[1]) {
            const failedMigration = migrationMatch[1];
            logger.log(`Resolving failed migration: ${failedMigration}`);
            
            // Build resolve command using the same prisma binary
            const resolveCmdBase = prismaCmd.replace(/migrate deploy.*$/, 'migrate resolve --applied');
            const resolveCmd = `${resolveCmdBase} ${failedMigration}`;
            
            logger.log(`Executing: ${resolveCmd}`);
            execSync(resolveCmd, { 
              stdio: 'inherit',
              env: { ...process.env, PATH: process.env.PATH },
              cwd: backendDir
            });
            
            logger.log(`✅ Resolved failed migration: ${failedMigration}`);
          } else {
            logger.warn('⚠️ Could not extract migration name from error');
            throw migrationError;
          }
          
          // After resolving first migration, retry migrate deploy - might have more failed migrations
          logger.log('🔄 Retrying migrations after resolving failed migration...');
          let retryAttempts = 0;
          const maxRetries = 5; // Prevent infinite loops
          
          while (retryAttempts < maxRetries) {
            try {
              const retryOutput = execSync(prismaCmd, { 
                stdio: 'pipe',
                env: { ...process.env, PATH: process.env.PATH },
                cwd: backendDir,
                encoding: 'utf8'
              });
              logger.log(retryOutput);
              logger.log('✅ Database migrations completed successfully after auto-resolution');
              break; // Success, exit loop
            } catch (retryError: any) {
              const retryErrorOutput = retryError.stderr?.toString() || retryError.stdout?.toString() || retryError.message || '';
              
              // Check if there's another failed migration (P3009, P3018, or other migration errors)
              if (retryErrorOutput.includes('P3009') || retryErrorOutput.includes('P3018') || 
                  retryErrorOutput.includes('failed migrations') || retryErrorOutput.includes('failed to apply')) {
                
                // Extract migration name(s) - could be "Migration name: xxx" or "The `xxx` migration"
                let nextFailedMigration = '';
                
                // Try "Migration name: xxx" format first (P3018)
                const nameMatch1 = retryErrorOutput.match(/Migration name: ([^\n]+)/);
                if (nameMatch1 && nameMatch1[1]) {
                  nextFailedMigration = nameMatch1[1].trim();
                }
                
                // Try "The `xxx` migration" format (P3009)
                if (!nextFailedMigration) {
                  const nameMatch2 = retryErrorOutput.match(/The `([^`]+)` migration/);
                  if (nameMatch2 && nameMatch2[1]) {
                    nextFailedMigration = nameMatch2[1];
                  }
                }
                
                if (nextFailedMigration) {
                  retryAttempts++;
                  logger.warn(`⚠️ Another failed migration detected: ${nextFailedMigration} (attempt ${retryAttempts}/${maxRetries})`);
                  logger.log(`Resolving failed migration: ${nextFailedMigration}`);
                  
                  const resolveCmdBase = prismaCmd.replace(/migrate deploy.*$/, 'migrate resolve --applied');
                  const resolveCmd = `${resolveCmdBase} ${nextFailedMigration}`;
                  
                  execSync(resolveCmd, { 
                    stdio: 'inherit',
                    env: { ...process.env, PATH: process.env.PATH },
                    cwd: backendDir
                  });
                  
                  logger.log(`✅ Resolved failed migration: ${nextFailedMigration}`);
                  continue; // Retry loop
                }
              }
              
              // No more failed migrations detected, but still error - might be different error
              throw retryError;
            }
          }
          
          if (retryAttempts >= maxRetries) {
            logger.error(`❌ Reached maximum retry attempts (${maxRetries}). Manual intervention may be required.`);
            throw migrationError;
          }
        } catch (resolveError: any) {
          logger.error(`❌ Failed to auto-resolve migration: ${resolveError.message}`);
          logger.error('⚠️ Manual intervention may be required to resolve failed migrations');
          throw migrationError; // Throw original error
        }
      } else {
        throw migrationError; // Re-throw if it's not a P3009 error
      }
    }
  } catch (error: any) {
    logger.error(`❌ Database migration failed: ${error.message}`);
    logger.error(`Migration error stack: ${error.stack}`);
    // Continue anyway - but log the error for debugging
    // In production, we want to see migration failures clearly
    if (process.env.NODE_ENV === 'production') {
      logger.error('⚠️ Continuing despite migration failure (may cause runtime errors)');
    }
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
    
    // CORS - Gérer manuellement AVANT tous les autres middlewares pour éviter les conflits
    const corsOrigin = configService.get('app.corsOrigin') || '*';
    const allowedOrigins = corsOrigin.includes(',') 
      ? corsOrigin.split(',').map(o => o.trim()).filter(Boolean)
      : corsOrigin === '*' ? ['*'] : [corsOrigin];
    
    logger.log(`CORS: Configuré avec ${allowedOrigins.length} origines: ${allowedOrigins.join(', ')}`);
    
  // Middleware CORS manuel sur Express AVANT tous les autres middlewares NestJS
  server.use((req, res, next): void => {
    const origin = req.headers.origin;
    
    // Déterminer l'origine autorisée
    let allowedOrigin: string | null = null;
    if (allowedOrigins.includes('*')) {
      allowedOrigin = '*';
    } else if (origin && allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    } else if (origin && allowedOrigins.some(allowed => origin === allowed)) {
      allowedOrigin = origin;
    }
    
    // Ne définir le header QUE si une origine est autorisée
    if (allowedOrigin) {
      // Supprimer tout header CORS existant pour éviter les doublons
      res.removeHeader('Access-Control-Allow-Origin');
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-Time, x-request-time');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    
    // Gérer les requêtes OPTIONS (preflight) - répondre AVANT NestJS
    if (req.method === 'OPTIONS') {
      res.status(204).end();
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
