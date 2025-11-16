import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ShopifyModule } from './shopify.module';

async function bootstrap() {
  const app = await NestFactory.create(ShopifyModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com"],
        scriptSrc: ["'self'", "https://cdn.shopify.com", "https://checkout.shopifycs.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.shopify.com", "https://*.myshopify.com"],
        frameSrc: ["'self'", "https://*.shopify.com", "https://*.myshopify.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }));

  // Compression
  app.use(compression());

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  }));

  // CORS configuration for Shopify
  app.enableCors({
    origin: [
      /\.shopify\.com$/,
      /\.myshopify\.com$/,
      'https://admin.shopify.com',
      'https://partners.shopify.com',
      configService.get('FRONTEND_URL', 'http://localhost:3000'),
      configService.get('SHOPIFY_APP_URL', 'http://localhost:3001'),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Shopify-Shop-Domain',
      'X-Shopify-Access-Token',
      'X-Shopify-Hmac-Sha256',
      'X-Shopify-Topic',
      'X-Shopify-Webhook-Id',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Luneo Shopify API')
      .setDescription('API pour l\'intégration Luneo avec Shopify')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentification OAuth Shopify')
      .addTag('webhooks', 'Webhooks Shopify')
      .addTag('billing', 'Facturation et abonnements')
      .addTag('app-bridge', 'App Bridge Shopify')
      .addTag('embed', 'Configuration des widgets embed')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Luneo Shopify API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'luneo-shopify-app',
      version: '1.0.0',
    });
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Luneo Shopify App démarrée sur le port ${port}`);
  console.log(`📚 Documentation API: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Erreur lors du démarrage de l\'application:', error);
  process.exit(1);
});



