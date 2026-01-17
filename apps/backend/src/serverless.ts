/**
 * Serverless Handler pour Vercel
 * Optimisé pour les fonctions serverless avec cold start réduit
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import * as cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

const logger = new Logger('ServerlessHandler');

let cachedApp: express.Application | null = null;

/**
 * Crée l'application NestJS optimisée pour serverless
 */
async function createApp(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  const server = express();
  
  // Preserve raw body for Stripe webhook signature verification
  // This must be done BEFORE NestJS body parsing
  // Apply raw body parser specifically for webhook route
  server.use('/billing/webhook', express.raw({ type: 'application/json' }));
  
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

  // CORS - Gérer manuellement AVANT tous les autres middlewares pour éviter les conflits
  const corsOrigin = configService.get('app.corsOrigin') || '*';
  const allowedOrigins = corsOrigin.includes(',') 
    ? corsOrigin.split(',').map((o: string) => o.trim()).filter(Boolean)
    : corsOrigin === '*' ? ['*'] : [corsOrigin];
  
  logger.log(`CORS: Configuré avec ${allowedOrigins.length} origines: ${allowedOrigins.join(', ')}`);
  
  // Middleware CORS manuel sur Express AVANT tous les autres middlewares NestJS
  server.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Déterminer l'origine autorisée
    let allowedOrigin: string | null = null;
    if (allowedOrigins.includes('*')) {
      allowedOrigin = '*';
    } else if (origin && allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    } else if (origin && allowedOrigins.some((allowed: string) => origin === allowed)) {
      allowedOrigin = origin;
    }
    
    // Ne définir le header QUE si une origine est autorisée
    if (allowedOrigin) {
      // Supprimer tout header CORS existant pour éviter les doublons
      res.removeHeader('Access-Control-Allow-Origin');
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    
    // Gérer les requêtes OPTIONS (preflight) - répondre AVANT NestJS
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
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
  server.get('/health', (_req: express.Request, res: express.Response) => {
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
export default async function handler(req: express.Request, res: express.Response) {
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

