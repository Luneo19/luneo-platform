# 🔧 ARCHITECTURE TECHNIQUE COMPLÈTE

**Date:** 29 Octobre 2025  
**Documentation:** Guide de référence pour modifications et maintenance

---

## 📋 TABLE DES MATIÈRES

1. [Configuration du projet](#configuration)
2. [Frontend - Détails techniques](#frontend-details)
3. [Backend - Détails techniques](#backend-details)
4. [API Routes complètes](#api-routes)
5. [Composants critiques](#composants)
6. [Système de paiement Stripe](#stripe)
7. [Base de données Supabase](#database)
8. [Scripts et automatisation](#scripts)

---

<a name="configuration"></a>
## ⚙️ CONFIGURATION DU PROJET

### Package.json racine

**Fichier:** `/package.json`

```json
{
  "name": "luneo-enterprise-saas",
  "version": "2.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "deploy": "turbo run deploy"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.10.0",
  "dependencies": {
    "stripe": "^19.1.0"
  }
}
```

### Turborepo Configuration

**Fichier:** `/turbo.json`

**Pipeline:**
- `build`: Compile tous les apps
- `dev`: Mode développement
- `lint`: ESLint
- `test`: Tests unitaires
- `deploy`: Build + test + lint + déploiement

**Outputs:**
- `.next/**` (Next.js)
- `dist/**` (NestJS)
- `out/**` (Static export)

---

<a name="frontend-details"></a>
## 🎨 FRONTEND - DÉTAILS TECHNIQUES

### Package.json Frontend

**Dépendances principales:**

```json
{
  "dependencies": {
    // Framework
    "next": "^15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    
    // UI & Styling
    "tailwindcss": "^3.4.0",
    "@radix-ui/*": "^1.0.0 - ^2.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    
    // State Management
    "zustand": "^4.5.7",
    "@tanstack/react-query": "^5.17.0",
    "swr": "^2.2.4",
    
    // Forms
    "react-hook-form": "^7.63.0",
    "zod": "^3.25.76",
    "@hookform/resolvers": "^3.10.0",
    
    // 2D Editor
    "konva": "^10.0.8",
    "react-konva": "^19.2.0",
    
    // 3D & AR
    "three": "^0.180.0",
    "@react-three/fiber": "^9.4.0",
    "@react-three/drei": "^10.7.6",
    "@mediapipe/face_mesh": "^0.4",
    "@mediapipe/hands": "^0.4",
    "@tensorflow/tfjs-core": "^4.22.0",
    
    // Data & API
    "axios": "^1.6.2",
    "@supabase/ssr": "^0.7.0",
    "stripe": "^19.1.0",
    
    // Export & Utils
    "jspdf": "^3.0.3",
    "html2canvas": "^1.4.1",
    "archiver": "^7.0.1",
    "sharp": "^0.34.4",
    
    // Charts
    "@nivo/bar": "^0.87.0",
    "@nivo/line": "^0.87.0",
    "@nivo/pie": "^0.87.0",
    "recharts": "^2.8.0",
    
    // Monitoring
    "@sentry/nextjs": "^10.22.0",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    
    // Rate Limiting
    "@upstash/ratelimit": "^2.0.6",
    "@upstash/redis": "^1.35.6"
  }
}
```

### Next.config.mjs

**Fichier:** `apps/frontend/next.config.mjs`

**Configuration complète:**

```javascript
{
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif']
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
  webpack: (config, { isServer }) => {
    // Fallbacks client-side
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        process: false
      };
    }
    
    // Ignorer les fichiers de test
    config.module.rules.push({
      test: /\.test\.(ts|tsx|js|jsx)$/,
      loader: 'ignore-loader'
    });
    
    return config;
  }
}
```

### Middleware.ts

**Fichier:** `apps/frontend/middleware.ts`

**Fonctionnalités:**

1. **Rate Limiting** (Upstash Redis)
   - Si UPSTASH_REDIS_REST_URL configuré
   - Limite par IP
   - Fallback gracieux si non configuré

2. **Authentication** (Supabase)
   - Vérification session
   - Refresh automatique
   - Redirect vers /login si non authentifié

3. **Routes protégées**
   - Dashboard: auth required
   - API routes: gestion interne
   - Public: libre accès

**Matcher:**
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
]
```

### Layout Root

**Fichier:** `apps/frontend/src/app/layout.tsx`

**Providers inclus:**
- Supabase SSR
- TanStack Query
- Zustand stores
- Theme provider

**Composants globaux:**
- CookieBanner (GDPR)
- Vercel Analytics
- Speed Insights
- Web Vitals Reporter

**Metadata:**
- Title template
- Description SEO
- Keywords
- Open Graph
- Twitter Card
- Robots.txt config
- Sitemap config

### Routes dynamiques

**Patterns utilisés:**

```
[productId]              # Product détails
[id]                     # Generic ID
[token]                  # Share tokens
[...slug]                # Catch-all (blog)
```

**Exemples:**
```
/customize/[productId]            # Customizer pour produit spécifique
/3d-view/[productId]              # Vue 3D produit
/try-on/[productId]               # Virtual Try-On produit
/share/[token]                    # Partage design
/blog/[id]                        # Article blog
```

---

<a name="backend-details"></a>
## ⚙️ BACKEND - DÉTAILS TECHNIQUES

### Package.json Backend

**Dépendances principales:**

```json
{
  "dependencies": {
    // Framework
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    
    // Configuration
    "@nestjs/config": "^3.1.1",
    "@nestjs/swagger": "^7.1.17",
    
    // Auth
    "@nestjs/passport": "^10.0.2",
    "@nestjs/jwt": "^10.2.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    
    // Database
    "@prisma/client": "^5.22.0",
    
    // Queue & Jobs
    "@nestjs/bull": "^10.0.1",
    "bullmq": "^5.1.3",
    "ioredis": "^5.3.2",
    
    // Security
    "helmet": "^7.1.0",
    "hpp": "^0.2.3",
    "express-rate-limit": "^7.1.5",
    
    // Utilities
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "lodash": "^4.17.21",
    "moment": "^2.30.1",
    
    // Integrations
    "stripe": "^14.12.0",
    "sharp": "^0.33.2",
    
    // Monitoring
    "@sentry/nestjs": "^7.91.0",
    "@nestjs/terminus": "^10.2.0",
    "@nestjs/event-emitter": "^2.0.3",
    "@nestjs/schedule": "^4.0.0"
  }
}
```

### App.module.ts

**Fichier:** `apps/backend/src/app.module.ts`

**Modules importés (19 modules):**

```typescript
@Module({
  imports: [
    // Monitoring
    SentryModule.forRoot(),
    
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        oauthConfig,
        stripeConfig,
        cloudinaryConfig,
        aiConfig,
        emailConfig,
        appConfig,
        monitoringConfig
      ]
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      throttlers: [{ ttl: 60000, limit: 100 }]
    }),
    
    // Health checks
    TerminusModule,
    
    // Events
    EventEmitterModule.forRoot(),
    
    // Scheduled tasks
    ScheduleModule.forRoot(),
    
    // Job queues (BullMQ)
    BullModule.forRootAsync({
      redis: configService.get('redis.url')
    }),
    
    // Application modules
    AuthModule,
    UsersModule,
    BrandsModule,
    ProductsModule,
    DesignsModule,
    OrdersModule,
    AiModule,
    WebhooksModule,
    AdminModule,
    HealthModule,
    EmailModule,
    IntegrationsModule,
    PublicApiModule,
    BillingModule,
    PlansModule,
    ProductEngineModule,
    RenderModule,
    EcommerceModule,
    UsageBillingModule,
    SecurityModule,
    AnalyticsModule,
    
    // Common & Jobs
    CommonModule,
    JobsModule
  ]
})
```

### Main.ts - Bootstrap

**Fichier:** `apps/backend/src/main.ts`

**Configuration:**

1. **Validation d'environnement**
   ```typescript
   validateEnv(); // Vérifie toutes les variables requises
   ```

2. **Security middleware**
   ```typescript
   app.use(helmet());
   app.use(compression());
   app.use(hpp());
   ```

3. **Rate limiting (production)**
   ```typescript
   const limiter = rateLimit({
     windowMs: 60000,
     max: 100,
     message: { error: 'Too many requests' }
   });
   ```

4. **CORS**
   ```typescript
   app.enableCors({
     origin: configService.get('app.corsOrigin'),
     credentials: true
   });
   ```

5. **Global prefix**
   ```typescript
   app.setGlobalPrefix('/api/v1');
   ```

6. **Validation pipe**
   ```typescript
   app.useGlobalPipes(new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true,
     transform: true
   }));
   ```

7. **Swagger (dev only)**
   ```typescript
   if (NODE_ENV !== 'production') {
     setupSwagger(app);
   }
   ```

### Guards & Interceptors

**Guards:**
```
common/guards/
├── jwt-auth.guard.ts              # JWT validation
└── roles.guard.ts                 # RBAC

modules/public-api/guards/
└── api-key.guard.ts               # API Key validation
```

**Interceptors:**
```
common/interceptors/
└── response.interceptor.ts        # Format réponses
```

**Filters:**
```
common/filters/
└── http-exception.filter.ts       # Gestion erreurs
```

### Configuration Services

**Fichiers de config:**

```typescript
config/
├── configuration.ts               # Configs principales
└── email-domain-config.ts         # Config email domains

// Dans configuration.ts:
export const databaseConfig = () => ({
  database: {
    url: process.env.DATABASE_URL
  }
});

export const redisConfig = () => ({
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
});

export const jwtConfig = () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  }
});

export const stripeConfig = () => ({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      pro: process.env.STRIPE_PRICE_PRO,
      business: process.env.STRIPE_PRICE_BUSINESS,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE
    },
    successUrl: process.env.STRIPE_SUCCESS_URL,
    cancelUrl: process.env.STRIPE_CANCEL_URL
  }
});
```

---

<a name="api-routes"></a>
## 🌐 API ROUTES COMPLÈTES

### Frontend API Routes (Next.js)

**Total:** 40+ routes

#### Authentification

```
POST   /api/auth/callback            # OAuth callback (Supabase)
```

#### Billing (Stripe)

```
POST   /api/billing/create-checkout-session   # Créer session Stripe
GET    /api/billing/subscription               # Info subscription
GET    /api/billing/invoices                   # Liste factures
POST   /api/stripe/webhook                     # Webhook Stripe
```

**FICHIER CRITIQUE:** `apps/frontend/src/app/api/billing/create-checkout-session/route.ts`

**Logique:**
1. Récupère planId, email, billing (monthly/yearly)
2. Sélectionne Price ID (monthly ou yearly)
3. Si yearly: crée dynamiquement un prix annuel
4. Crée session Stripe Checkout
5. Retourne URL de paiement

**Price IDs:**
```typescript
professional: { 
  monthly: 'price_PRO_MONTHLY',
  yearly: 'price_PRO_MONTHLY' // Même ID, prix créé dynamiquement
},
business: { 
  monthly: 'price_BUSINESS_MONTHLY',
  yearly: 'price_BUSINESS_MONTHLY'
},
enterprise: { 
  monthly: 'price_ENTERPRISE_MONTHLY',
  yearly: 'price_ENTERPRISE_MONTHLY'
}
```

**Montants annuels (en centimes):**
```typescript
const yearlyAmounts = {
  professional: 27840,  // €278.40
  business: 56640,      // €566.40
  enterprise: 95040     // €950.40
};
```

#### Products

```
GET    /api/products                  # Liste produits
POST   /api/products                  # Créer produit
GET    /api/products/:id              # Détails produit
PUT    /api/products/:id              # Modifier produit
DELETE /api/products/:id              # Supprimer produit
```

#### Designs

```
GET    /api/designs                   # Liste designs
POST   /api/designs                   # Créer design
GET    /api/designs/:id               # Détails design
PUT    /api/designs/:id               # Modifier design
DELETE /api/designs/:id               # Supprimer design
POST   /api/designs/save-custom       # Sauver design custom
POST   /api/designs/export-print      # Export print-ready
GET    /api/designs/:id/share         # Partager design
```

#### Orders

```
GET    /api/orders                    # Liste commandes
POST   /api/orders                    # Créer commande
GET    /api/orders/:id                # Détails commande
PUT    /api/orders/:id                # Modifier commande
POST   /api/orders/generate-production-files  # Fichiers production
```

#### Templates & Cliparts

```
GET    /api/templates                 # Liste templates
GET    /api/templates/:id             # Détails template
GET    /api/cliparts                  # Liste cliparts
GET    /api/cliparts/:id              # Détails clipart
```

#### Collections

```
GET    /api/collections               # Liste collections
POST   /api/collections               # Créer collection
GET    /api/collections/:id           # Détails collection
DELETE /api/collections/:id           # Supprimer collection
POST   /api/collections/:id/items     # Ajouter item
```

#### Profile & Team

```
GET    /api/profile                   # Profil utilisateur
PUT    /api/profile                   # Modifier profil
PUT    /api/profile/avatar            # Upload avatar
PUT    /api/profile/password          # Changer mot de passe

GET    /api/team                      # Liste membres équipe
POST   /api/team                      # Inviter membre
DELETE /api/team/:id                  # Retirer membre
```

#### API Keys & Webhooks

```
GET    /api/api-keys                  # Liste clés API
POST   /api/api-keys                  # Créer clé
DELETE /api/api-keys/:id              # Supprimer clé

GET    /api/webhooks                  # Liste webhooks
POST   /api/webhooks                  # Créer webhook
DELETE /api/webhooks/:id              # Supprimer webhook
```

#### Integrations

```
GET    /api/integrations/shopify/connect    # Connexion Shopify
GET    /api/integrations/shopify/callback   # Callback Shopify
POST   /api/integrations/shopify/sync       # Sync Shopify
GET    /api/integrations/woocommerce/connect
POST   /api/integrations/woocommerce/sync
```

#### AI & AR

```
POST   /api/ai/generate               # Générer design IA
POST   /api/ar/upload                 # Upload modèle AR
POST   /api/ar/convert-2d-to-3d       # Convertir 2D → 3D
GET    /api/ar/export                 # Exporter AR
POST   /api/3d/render-highres         # Render 3D haute résolution
POST   /api/3d/export-ar              # Export AR ready
```

#### Analytics & Monitoring

```
GET    /api/analytics/overview        # Vue d'ensemble analytics
GET    /api/dashboard/stats           # Stats dashboard
GET    /api/health                    # Health check
```

#### GDPR

```
GET    /api/gdpr/export               # Exporter données utilisateur
DELETE /api/gdpr/delete-account       # Supprimer compte
```

#### Emails

```
POST   /api/emails/send-welcome              # Email bienvenue
POST   /api/emails/send-order-confirmation   # Confirmation commande
POST   /api/emails/send-production-ready     # Fichiers prêts
```

#### Notifications

```
GET    /api/notifications             # Liste notifications
PUT    /api/notifications/:id         # Marquer lu
```

#### Others

```
GET    /api/csrf/token                # Token CSRF
GET    /api/downloads                 # Téléchargements
POST   /api/favorites                 # Favoris
GET    /api/share/:token              # Accès design partagé
POST   /api/webhooks/pod              # POD webhook
POST   /api/webhooks/ecommerce        # E-commerce webhook
GET    /api/audit/logs                # Logs audit
GET    /api/brand-settings            # Brand settings
```

---

<a name="composants"></a>
## 🧩 COMPOSANTS CRITIQUES

### ProductCustomizer (2D Editor)

**Fichier:** `apps/frontend/src/components/Customizer/ProductCustomizer.tsx`

**Technologies:**
- Konva.js (canvas manipulation)
- React-Konva (React wrapper)

**Features:**
- Texte éditable
- Images/Cliparts
- Formes géométriques
- Couleurs
- Filtres
- Layers
- Undo/Redo
- Export PNG/SVG/PDF

**Props:**
```typescript
{
  productId: string;
  initialDesign?: KonvaJSON;
  onSave?: (design: KonvaJSON) => void;
}
```

### ProductConfigurator3D (3D Configurator)

**Fichier:** `apps/frontend/src/components/3d-configurator/ProductConfigurator3D.tsx`

**Technologies:**
- Three.js (3D rendering)
- React-Three-Fiber (React wrapper)
- React-Three-Drei (helpers)

**Features:**
- Rotation 360°
- Zoom
- Changement couleurs
- Changement matériaux
- Changement parties
- Lighting dynamique
- Export GLTF/GLB

**Props:**
```typescript
{
  productId: string;
  model3dUrl: string;
  configurableparts?: string[];
  onSave?: (config: Config3D) => void;
}
```

### Virtual Try-On (AR)

**Fichiers:**
```
apps/frontend/src/components/virtual-tryon/
├── EyewearTryOn.tsx              # Lunettes
├── JewelryTryOn.tsx              # Bijoux
└── WatchTryOn.tsx                # Montres
```

**Technologies:**
- MediaPipe Face Mesh
- MediaPipe Hands
- TensorFlow.js
- WebGL

**Features:**
- Détection faciale temps réel
- Détection mains
- Overlay 3D/2D
- Screenshot
- Export

### Sidebar Dashboard

**Fichier:** `apps/frontend/src/components/dashboard/Sidebar.tsx`

**Navigation:**
```typescript
[
  { name: 'Dashboard', href: '/dashboard/dashboard', icon: Home },
  { name: 'AI Studio', href: '/dashboard/ai-studio', icon: Sparkles },
  { name: 'AR Studio', href: '/dashboard/ar-studio', icon: Camera },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Bibliothèque', href: '/dashboard/library', icon: Library },
  { name: 'Templates', href: '/dashboard/templates', icon: Layout },
  { name: 'Intégrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Facturation', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Équipe', href: '/dashboard/team', icon: Users },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings }
]
```

### UnifiedNav (Navigation publique)

**Fichier:** `apps/frontend/src/components/layout/UnifiedNav.tsx`

**Menu:**
```typescript
{
  name: 'Produit',
  items: [
    { name: 'Fonctionnalités', href: '/features' },
    { name: 'Tarifs', href: '/pricing' },
    { name: 'Templates', href: '/templates' }
  ]
},
{
  name: 'Solutions',
  items: [
    { name: 'E-commerce', href: '/solutions/ecommerce' },
    { name: 'Branding', href: '/solutions/branding' },
    { name: 'Marketing', href: '/solutions/marketing' },
    { name: 'Social Media', href: '/solutions/social' }
  ]
},
{
  name: 'Ressources',
  items: [
    { name: 'Documentation', href: '/help/documentation' },
    { name: 'Blog', href: '/blog' },
    { name: 'Galerie', href: '/gallery' }
  ]
}
```

---

<a name="stripe"></a>
## 💳 SYSTÈME DE PAIEMENT STRIPE

### Architecture Stripe

```
Page Pricing
    ↓ handleStripeCheckout(planId, billingCycle)
API Route /api/billing/create-checkout-session
    ↓ 
    1. Récupérer Product ID depuis Price ID
    2. Si yearly: créer prix annuel dynamiquement
    3. Créer session Stripe
    ↓
Stripe Checkout
    ↓ Paiement
Webhook /api/stripe/webhook
    ↓ 
    1. Vérifier signature
    2. Traiter events (checkout.session.completed, etc.)
    3. Mettre à jour Supabase (profiles table)
```

### Fichiers Stripe

**1. Page Pricing**
- **Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`
- **Lignes:** 260
- **Fonction clé:** `handleStripeCheckout(planId, billingCycle)`

**2. API Route Checkout**
- **Fichier:** `apps/frontend/src/app/api/billing/create-checkout-session/route.ts`
- **Lignes:** 159
- **Runtime:** nodejs
- **Méthode:** POST

**3. Webhook Stripe**
- **Fichier:** `apps/frontend/src/app/api/stripe/webhook/route.ts`
- **Lignes:** 316
- **Events:** checkout.session.completed, customer.subscription.*

**4. Backend Service**
- **Fichier:** `apps/backend/src/modules/billing/billing.service.ts`
- **Méthodes:**
  - `createCheckoutSession()`
  - `createCustomerPortalSession()`
  - `handleWebhook()`

### Plans & Pricing

**Configuration actuelle:**

| Plan | Mensuel | Annuel | Price ID Monthly | Product ID |
|------|---------|--------|------------------|------------|
| Starter | Gratuit | Gratuit | - | - |
| Professional | €29 | €278.40 | price_PRO_MONTHLY | Auto-récupéré |
| Business | €59 | €566.40 | price_BUSINESS_MONTHLY | prod_TDYaUcC0940jpT |
| Enterprise | €99 | €950.40 | price_ENTERPRISE_MONTHLY | prod_TDYaqgD6gwRVd0 |

**Features par plan:**

**Starter (Gratuit):**
- 10 designs/mois
- Templates de base
- Support email
- Export PNG

**Professional (€29/mois):**
- 100 designs/mois
- Templates premium
- Support prioritaire
- Export HD/PDF
- API access
- 5 membres équipe
- 10GB stockage

**Business (€59/mois):**
- 500 designs/mois
- Templates exclusifs
- Support chat
- Export HD/PDF/SVG
- API avancé
- 15 membres équipe
- 50GB stockage

**Enterprise (€99/mois):**
- Designs illimités
- Templates exclusifs
- Support 24/7
- Export personnalisé
- API avancé
- Équipe illimitée
- Stockage illimité
- SLA 99.9%

### URLs Stripe

**Hardcodées:**
```typescript
success_url: 'https://app.luneo.app/dashboard/billing?session_id={CHECKOUT_SESSION_ID}'
cancel_url: 'https://app.luneo.app/pricing'
```

**Ne PAS utiliser de variables env!** (causait des erreurs)

### Trial Period

**Tous les plans:** 14 jours gratuits

```typescript
subscription_data: {
  trial_period_days: 14
}
```

---

<a name="database"></a>
## 🗄️ BASE DE DONNÉES SUPABASE

### Configuration Supabase

**Projet:** Luneo Platform Production  
**Project ID:** obrijgptqztacolemsbk  
**URL:** https://obrijgptqztacolemsbk.supabase.co  
**Region:** US East

**Clés:**
```
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8

Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE
```

### Tables principales

#### profiles (Profils utilisateurs)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  company VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  
  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_period VARCHAR(20) DEFAULT 'monthly',
  trial_ends_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  -- Metadata
  preferences JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

**Indexes:**
- email (unique)
- stripe_customer_id (unique)
- subscription_tier

**RLS:**
- Users can view own profile
- Users can update own profile

#### designs (Designs utilisateur)

```sql
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  design_data JSONB NOT NULL,
  preview_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### products (Produits)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  base_price DECIMAL(10,2),
  image_url TEXT,
  model_3d_url TEXT,
  customizable BOOLEAN DEFAULT true,
  customization_options JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### orders (Commandes)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'created',
  total_amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### order_items (Items de commande)

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  design_id UUID REFERENCES designs(id),
  product_name VARCHAR(255),
  design_name VARCHAR(255),
  design_preview_url TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  production_status VARCHAR(50) DEFAULT 'pending',
  production_files JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### templates (Templates)

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  preview_url TEXT NOT NULL,
  konva_json JSONB NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### cliparts (Cliparts/SVG)

```sql
CREATE TABLE cliparts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  svg_content TEXT NOT NULL,
  preview_url TEXT,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Clients Supabase

**3 clients différents:**

**1. Client (Browser)**
- **Fichier:** `apps/frontend/src/lib/supabase/client.ts`
- **Usage:** Composants client-side
- **Type:** BrowserClient

**2. Server (Server Components)**
- **Fichier:** `apps/frontend/src/lib/supabase/server.ts`
- **Usage:** Server Components, API Routes
- **Type:** ServerClient

**3. Middleware**
- **Fichier:** `apps/frontend/src/lib/supabase/middleware.ts`
- **Usage:** Edge middleware
- **Type:** MiddlewareClient

---

<a name="scripts"></a>
## 🔧 SCRIPTS ET AUTOMATISATION

### Scripts disponibles

**Root:**
```bash
pnpm build        # Build tous les apps
pnpm dev          # Dev tous les apps
pnpm lint         # Lint tous les apps
pnpm test         # Tests tous les apps
pnpm deploy       # Deploy tous les apps
```

**Frontend:**
```bash
pnpm dev          # Dev server
pnpm build        # Production build
pnpm build:analyze  # Build avec analyse bundle
pnpm start        # Production server
pnpm lint         # ESLint
pnpm lint:check   # ESLint check only
pnpm format       # Prettier
pnpm format:check # Prettier check
pnpm type-check   # TypeScript check
pnpm test         # Vitest
pnpm test:e2e     # Playwright E2E
```

**Backend:**
```bash
npm run build        # Compile NestJS
npm run start        # Production start
npm run start:dev    # Dev mode avec watch
npm run start:prod   # Production mode
```

### Scripts Shell

**Déploiement:**
```
deploy-luneo.sh                    # Deploy complet
deploy-now.sh                      # Deploy rapide
deploy-phase1.sh                   # Deploy phase 1
```

**Utilitaires:**
```
check-and-configure-env-variables.sh   # Vérifier env vars
test-profile-api.sh                    # Tester API profil
```

**Backend:**
```
apps/backend/scripts/
├── setup-production.js            # Setup production
├── generate-env.js                # Générer .env
├── setup-hetzner-env.sh           # Setup Hetzner
├── setup-hetzner-cloudflare.sh    # Setup DNS
└── ... (20+ scripts)
```

### Scripts SQL

**Migrations:**
```
supabase-migration-init.sql                    # Migration initiale
supabase-optimize-FINAL-PRODUCTION.sql         # Optimisations
create-all-missing-tables.sql                  # Toutes les tables
```

**Seeds:**
```
seed-templates.sql                  # Seed templates
seed-cliparts.sql                   # Seed cliparts
seed-cliparts-safe.sql              # Seed cliparts (safe)
```

**Vérifications:**
```
VERIFICATION_TABLES_FINALE.sql      # Vérifier tables
VERIFY_ALL_COLUMNS.sql              # Vérifier colonnes
GET_ALL_TABLES_SCHEMA.sql           # Schema complet
CHECK_USER_TABLES.sql               # Vérifier user tables
```

---

## 📄 DOCUMENTATION CRÉÉE

### Documentation Stripe

```
GUIDE_REFERENCE_STRIPE_COMPLET.md          # Guide complet Stripe
DOCUMENTATION_COMMENT_CELA_FONCTIONNE.md   # Fonctionnement détaillé
SUCCES_PLANS_ANNUELS_100_POURCENT.md       # Succès plans annuels
FINALISATION_STRIPE_COMPLETE.md            # Finalisation
DOCUMENTATION_COMPLETE_STRIPE_PRODUCTION.md # Doc production
```

### Documentation Technique

```
AUDIT_COMPLET_ARCHITECTURE_FINALE.md       # Audit architecture (ce fichier)
ARCHITECTURE_TECHNIQUE_COMPLETE.md         # Architecture technique (actuel)
```

### Documentation Déploiement

```
GUIDE_VERCEL_DETAILLE.md                   # Guide Vercel
START_HERE_PRODUCTION.md                   # Démarrage production
DEPLOIEMENT_PRODUCTION_FINAL.md            # Déploiement final
```

### Autres guides

```
GUIDE_SETUP_REDIS_UPSTASH.md               # Redis setup
GUIDE_SSO_ENTERPRISE.md                    # SSO enterprise
GUIDE_CUSTOM_DOMAINS.md                    # Custom domains
CONFIGURATION_OAUTH_SUPABASE.md            # OAuth config
```

---

## 🎯 CHECKLIST MODIFICATION PRIX

### Pour modifier un prix mensuel

1. ✅ Créer nouveau prix dans Stripe Dashboard
2. ✅ Copier le Price ID
3. ✅ Modifier `create-checkout-session/route.ts` ligne ~32
4. ✅ Modifier `pricing/page.tsx` ligne ~36 (price)
5. ✅ Calculer yearlyPrice: `price * 12 * 0.8`
6. ✅ Modifier `create-checkout-session/route.ts` ligne ~112 (yearlyAmounts)
7. ✅ Build et test local
8. ✅ Deploy sur Vercel
9. ✅ Tester en production

### Pour ajouter un nouveau plan

1. ✅ Créer produit dans Stripe
2. ✅ Créer prix mensuel
3. ✅ Copier Product ID et Price ID
4. ✅ Ajouter dans `planPrices` (API route)
5. ✅ Ajouter dans `yearlyAmounts` (API route)
6. ✅ Ajouter dans `plans[]` (pricing page)
7. ✅ Build et deploy
8. ✅ Tester

---

## 🎉 RÉSUMÉ TECHNIQUE

**Monorepo:** Turborepo + pnpm  
**Apps:** 7 (frontend, backend, mobile, shopify, widget, worker, ar-viewer)  
**Packages:** 6 (ui, types, config, logger, eslint, tsconfig)  

**Frontend:**
- Next.js 15 (App Router)
- 50+ pages
- 40+ API routes
- 150+ composants
- 20+ hooks

**Backend:**
- NestJS 10
- 19 modules
- 80+ endpoints
- 40+ services
- 12+ models Prisma

**Database:**
- Supabase PostgreSQL
- 30+ tables
- RLS activé
- Indexes optimisés

**Paiements:**
- Stripe Checkout
- 3 plans (Professional, Business, Enterprise)
- Monthly/Yearly avec -20%
- Webhooks configurés

**Status:** ✅ Production Ready

---

*Documentation technique créée le 29 Oct 2025*

