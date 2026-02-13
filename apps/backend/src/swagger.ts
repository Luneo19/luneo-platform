import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { PublicApiController } from './modules/public-api/public-api.controller';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Luneo Backend API')
    .setDescription(`
# Luneo Backend API - SaaS de personnalisation produit

## Description
API backend pour la plateforme Luneo, permettant la personnalisation de produits avec IA.

## Fonctionnalités principales
- 🔐 Authentification JWT avec OAuth
- 🏢 Multi-tenancy (marques/entreprises)
- 🎨 Génération de designs avec IA
- 🛒 Gestion des commandes avec Stripe
- 📊 Administration et métriques
- 🔗 Webhooks pour intégrations

## Endpoints principaux

### Authentification
- \`POST /api/v1/auth/signup\` - Inscription utilisateur
- \`POST /api/v1/auth/login\` - Connexion
- \`POST /api/v1/auth/refresh\` - Renouvellement de token
- \`POST /api/v1/auth/logout\` - Déconnexion

### Produits
- \`GET /api/v1/products\` - Liste des produits publics
- \`GET /api/v1/products/:id\` - Détails d'un produit
- \`POST /api/v1/products/brands/:brandId/products\` - Créer un produit (Brand Admin)

### Designs
- \`POST /api/v1/designs\` - Créer un design avec IA
- \`GET /api/v1/designs/:id\` - Récupérer un design
- \`POST /api/v1/designs/:id/upgrade-highres\` - Améliorer en haute résolution

### Commandes
- \`POST /api/v1/orders\` - Créer une commande
- \`GET /api/v1/orders/:id\` - Détails d'une commande
- \`POST /api/v1/orders/:id/cancel\` - Annuler une commande

### Administration
- \`GET /api/v1/admin/metrics\` - Métriques de la plateforme
- \`GET /api/v1/admin/ai/costs\` - Coûts IA
- \`POST /api/v1/admin/ai/blacklist\` - Gérer la liste noire des prompts

## Exemples d'utilisation

### Créer un design
\`\`\`json
POST /api/v1/designs
Authorization: Bearer <token>

{
  "productId": "prod_abc",
  "prompt": "Collier minimaliste or 18k, pendentif coeur, gravure 'A.'",
  "options": {
    "material": "gold",
    "size": "S",
    "color": "yellow",
    "engravingText": "A."
  }
}
\`\`\`

### Créer une commande
\`\`\`json
POST /api/v1/orders
Authorization: Bearer <token>

{
  "items": [
    {
      "productId": "p_1",
      "designId": "d_123",
      "qty": 1,
      "unitPriceCents": 4900
    }
  ],
  "shipping": {
    "address": "123 Rue de la Paix, Paris",
    "method": "express"
  },
  "currency": "EUR"
}
\`\`\`

## Codes de statut
- \`200\` - Succès
- \`201\` - Créé
- \`202\` - Accepté (job en cours)
- \`400\` - Requête invalide
- \`401\` - Non authentifié
- \`403\` - Non autorisé
- \`404\` - Non trouvé
- \`429\` - Trop de requêtes
- \`500\` - Erreur serveur

## Rate Limiting
- Génération de designs : 20 req/min par utilisateur
- API générale : 100 req/min par IP

## Support
Pour toute question, contactez l'équipe technique.
    `)
    .setVersion('1.0.0')
    .addTag('Auth', 'Authentification et gestion des utilisateurs')
    .addTag('Users', 'Gestion des profils utilisateurs')
    .addTag('Brands', 'Gestion des marques (multi-tenancy)')
    .addTag('Products', 'Catalogue de produits')
    .addTag('Designs', 'Génération de designs avec IA')
    .addTag('Orders', 'Gestion des commandes et paiements')
    .addTag('AI', 'Services IA et quotas')
    .addTag('Webhooks', 'Intégrations webhooks')
    .addTag('Admin', 'Administration de la plateforme')
    .addTag('Health', 'Santé de l\'application')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.luneo.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  // Customize Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      tryItOutEnabled: true,
      requestInterceptor: (req: { headers?: Record<string, string> }) => {
        if (req.headers) req.headers['Content-Type'] = 'application/json';
        return req;
      },
    },
    customSiteTitle: 'Luneo API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; }
    `,
  });

  // Public API document at /api/public/docs (API key auth only)
  const publicConfig = new DocumentBuilder()
    .setTitle('Luneo Public API')
    .setDescription('Public REST API for Luneo. Authenticate with an API key in the `x-api-key` header. Rate limit: 100 requests/minute per key.')
    .setVersion('1.0.0')
    .addTag('Public API', 'Designs, products, orders, brand')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header', description: 'API key (format: lun_...)' },
      'x-api-key',
    )
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.luneo.com', 'Production')
    .build();

  const publicDocument = SwaggerModule.createDocument(app, publicConfig, {
    include: [PublicApiController],
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/public/docs', app, publicDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tryItOutEnabled: true,
      requestInterceptor: (req: { headers?: Record<string, string> }) => {
        if (req.headers) req.headers['Content-Type'] = 'application/json';
        return req;
      },
    },
    customSiteTitle: 'Luneo Public API',
  });

  return document;
}
