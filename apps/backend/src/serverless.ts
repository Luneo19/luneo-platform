/**
 * Serverless Handler pour Vercel
 * Optimisé pour les fonctions serverless avec cold start réduit
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
import type { Application, Request, Response } from 'express';
import { AppModule } from './app.module';

const logger = new Logger('ServerlessHandler');

let cachedApp: Application | null = null;

/**
 * Crée l'application NestJS optimisée pour serverless
 */
async function createApp(): Promise<Application> {
  if (cachedApp) {
    return cachedApp;
  }

  const server = express();
  
  // Preserve raw body for Stripe webhook signature verification
  // This must be done BEFORE NestJS body parsing
  // Apply raw body parser specifically for webhook routes
  server.use('/billing/webhook', express.raw({ type: 'application/json' }));
  server.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
  server.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));
  server.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
  
  // Apply JSON body parser for all other routes
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    {
      logger: process.env.NODE_ENV === 'production' 
        ? ['error', 'warn'] 
        : ['log', 'error', 'warn', 'debug'],
      bodyParser: false, // Disable default body parser since we handle it manually above
    },
  );

  const configService = app.get(ConfigService);

  // Security - Production-ready configuration
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

  // Compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // CORS - Configuration sécurisée alignée avec main.ts
  // IMPORTANT: Ne JAMAIS utiliser '*' en production avec credentials
  const nodeEnv = configService.get('app.nodeEnv') || process.env.NODE_ENV || 'development';
  const corsOriginFromConfig = configService.get<string>('app.corsOrigin');
  const hasCorsOrigins = process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.trim().length > 0;

  // Production: require explicit CORS configuration (no wildcard)
  if (
    nodeEnv === 'production' &&
    !hasCorsOrigins &&
    (!corsOriginFromConfig || corsOriginFromConfig === '*')
  ) {
    logger.error('FATAL: CORS_ORIGIN or CORS_ORIGINS must be explicitly configured in production (cannot be undefined or *)');
    throw new Error('CORS_ORIGIN or CORS_ORIGINS must be explicitly configured in production.');
  }

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const corsOriginEnv = corsOriginFromConfig || '';

  const productionOrigins = [
    'https://luneo.app',
    'https://www.luneo.app',
    'https://api.luneo.app',
  ];

  const originWildcardPatterns = [
    /^https:\/\/frontend-[a-z0-9-]+\.vercel\.app$/,
  ];

  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

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
  
  // Middleware CORS manuel sur Express AVANT tous les autres middlewares NestJS
  server.use((req: Request, res: Response, next: () => void): void => {
    const origin = req.headers.origin;
    
    // Vérifier si l'origine est autorisée (liste exacte + patterns wildcard)
    const isAllowed = isOriginAllowed(origin);
    
    // Ne définir le header QUE si une origine est autorisée
    if (isAllowed && origin) {
      res.removeHeader('Access-Control-Allow-Origin');
      res.setHeader('Access-Control-Allow-Origin', origin);
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
  
  // IMPORTANT: Ne PAS appeler app.enableCors() car CORS est géré manuellement avec Express
  // Cela évite les conflits et les doublons de headers

  // Global validation pipe
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

  // Swagger (seulement en développement)
  if (configService.get('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Luneo API')
      .setDescription('Luneo Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key' })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Health check endpoint optimisé
  server.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  await app.init();
  cachedApp = server;

  return server;
}

/**
 * Handler principal pour Vercel
 * Optimisé pour réduire le cold start
 */
export default async function handler(req: Request, res: Response) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    logger.error('Serverless handler error:', error instanceof Error ? error.stack : String(error));
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred processing your request',
    });
  }
}

