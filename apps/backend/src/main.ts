// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
import "./instrument";

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// import compression from 'compression';
// import hpp from 'hpp';
// import rateLimit from 'express-rate-limit';
// import slowDown from 'express-slow-down';

import { AppModule } from './app.module';
import { validateEnv } from './config/configuration';

async function bootstrap() {
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

  try {
    logger.log('Creating NestJS application...');
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

  const port = configService.get('app.port');
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔍 Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
