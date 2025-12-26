# 🏗️ Architecture - Luneo Platform

## 📊 Vue d'Ensemble

Luneo Platform est une plateforme SaaS B2B pour la personnalisation de produits avec IA, construite avec une architecture moderne et scalable.

## 🎯 Principes Architecturaux

- **Monorepo** - Gestion centralisée avec Turbo
- **Type-Safe** - TypeScript strict partout
- **Modular** - Séparation claire des responsabilités
- **Scalable** - Architecture prête pour la croissance
- **Secure** - Sécurité par design

## 📁 Structure du Projet

```
luneo-platform/
├── apps/
│   ├── frontend/          # Next.js 15 Frontend
│   ├── backend/           # NestJS Backend
│   └── ...
├── packages/              # Packages partagés
├── docs/                  # Documentation
└── infra/                 # Infrastructure as Code
```

## 🎨 Frontend Architecture

### Stack Technique
- **Framework**: Next.js 15 (App Router)
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **State**: React Query (TanStack), Zustand
- **API**: tRPC (type-safe)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + CSS Modules

### Structure Frontend

```
apps/frontend/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (public)/      # Pages publiques
│   │   ├── (dashboard)/   # Pages dashboard
│   │   ├── (auth)/        # Pages auth
│   │   └── api/           # API Routes
│   ├── components/        # Composants React
│   │   ├── ui/            # Composants UI de base
│   │   ├── layout/        # Layout components
│   │   └── ...
│   ├── lib/               # Utilitaires et services
│   │   ├── trpc/          # tRPC configuration
│   │   ├── services/      # Services métier
│   │   └── ...
│   ├── hooks/             # React hooks
│   ├── store/             # State management
│   └── types/             # TypeScript types
```

### Patterns Utilisés

#### 1. App Router (Next.js 15)
- Routing basé sur le système de fichiers
- Server Components par défaut
- Client Components avec `'use client'`

#### 2. tRPC
- Type-safe API calls
- End-to-end type safety
- Auto-complétion IDE

#### 3. Component Composition
- Composants UI réutilisables (shadcn/ui)
- Composition over inheritance
- Props drilling évité avec Context

#### 4. Error Handling
- Error boundaries
- Try-catch dans async functions
- Logging avec Sentry

## 🔧 Backend Architecture

### Stack Technique
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Queue**: BullMQ
- **Auth**: JWT + OAuth

### Structure Backend

```
apps/backend/
├── src/
│   ├── modules/           # Modules métier
│   │   ├── auth/
│   │   ├── users/
│   │   ├── products/
│   │   └── ...
│   ├── common/            # Code partagé
│   ├── libs/              # Libraries
│   └── config/            # Configuration
```

### Patterns Utilisés

#### 1. Modular Architecture
- Modules NestJS indépendants
- Services injectables
- Controllers pour routes

#### 2. Database
- Prisma ORM pour type-safety
- Migrations versionnées
- Seeds pour données de test

#### 3. Caching
- Redis pour cache
- Cache strategies par endpoint
- TTL appropriés

## 🔄 Flux de Données

### Frontend → Backend

1. **tRPC Calls**
   ```
   Component → tRPC Hook → tRPC Client → API Route → Backend
   ```

2. **REST API Calls**
   ```
   Component → fetch/axios → API Route → Backend
   ```

### Backend → Database

```
Service → Prisma Client → PostgreSQL
```

### Caching

```
Service → Redis Cache → (hit) Return / (miss) → Database
```

## 🔐 Sécurité

### Authentication
- Supabase Auth (frontend)
- JWT tokens
- Refresh tokens
- OAuth (Google, GitHub)

### Authorization
- Role-based access control (RBAC)
- Permissions par ressource
- API keys pour intégrations

### Data Protection
- Encryption at rest
- HTTPS (TLS)
- PII anonymization
- GDPR compliance

## 🚀 Déploiement

### Frontend
- **Platform**: Vercel
- **Build**: Next.js build
- **CDN**: Vercel Edge Network

### Backend
- **Platform**: Railway / Vercel
- **Database**: Neon PostgreSQL
- **Cache**: Upstash Redis

### CI/CD
- GitHub Actions
- Automated tests
- Staging deployment
- Production with approval

## 📊 Monitoring

### Error Tracking
- **Sentry** - Error tracking & Performance monitoring
  - Client, Server, Edge configurés
  - 10% sampling en production
  - Session Replay (10% sessions, 100% erreurs)
  - Browser Tracing intégré
  - Voir: `MONITORING_GUIDE.md`

### Performance
- **Core Web Vitals** - LCP, FID, CLS, FCP, TTFB
  - Tracking automatique
  - API endpoint: `/api/analytics/web-vitals`
  - Dashboard: `/dashboard/monitoring`
- **Vercel Analytics** - Web Analytics & Speed Insights
- **API response times** - Trackés via Sentry
- **Database query times** - Trackés via Prisma

### Business Analytics
- **Analytics Service** - Événements métier
- **API endpoint** - `/api/analytics/events`
- **Conversions** - Trackées automatiquement
- **User behavior** - Analytics dashboard
- **Feature usage** - Feature flags tracking

## 🔄 Workflows Principaux

### 1. User Registration
```
User → Register → Supabase Auth → Create Profile → Onboarding (4 steps) → Dashboard
```

**Fichiers:**
- `apps/frontend/src/app/(auth)/register/page.tsx`
- `apps/frontend/src/app/api/auth/onboarding/route.ts`

### 2. Design Creation
```
User → AI Studio → Enter Prompt → OpenAI API (GPT-4/DALL-E) → Design Generated → Save to DB → Gallery
```

**Fichiers:**
- `apps/frontend/src/app/(dashboard)/ai-studio/page.tsx`
- `apps/frontend/src/app/api/ai/generate/route.ts`
- `apps/frontend/src/lib/services/AIService.ts`

### 3. Checkout Flow
```
User → Pricing → Select Plan → Stripe Checkout Session → Redirect to Stripe → Webhook → Subscription Created → Success Page
```

**Fichiers:**
- `apps/frontend/src/app/(public)/pricing/page.tsx`
- `apps/frontend/src/app/api/billing/create-checkout-session/route.ts`
- `apps/frontend/src/app/api/stripe/webhook/route.ts`

### 4. Product Customization
```
User → Products → Select Product → Upload 3D Model → Configure Zones → Save Config → Export (GLB/USDZ/PNG) → Order Created
```

**Fichiers:**
- `apps/frontend/src/app/(dashboard)/products/page.tsx`
- `apps/frontend/src/components/dashboard/ZoneConfigurator.tsx`
- `apps/frontend/src/app/api/3d/export-ar/route.ts`

## 🗄️ Database Schema

### Tables Principales
- `users` - Utilisateurs (Supabase Auth)
- `brands` - Marques (white-label)
- `products` - Produits
- `product_variants` - Variantes de produits
- `designs` - Designs créés
- `design_versions` - Versions de designs
- `orders` - Commandes
- `order_items` - Items de commande
- `subscriptions` - Abonnements Stripe
- `invoices` - Factures
- `api_keys` - Clés API
- `webhook_endpoints` - Webhooks configurés
- `analytics_events` - Événements analytics
- `web_vitals` - Métriques Core Web Vitals
- `notifications` - Notifications utilisateur

**Schema:** `apps/frontend/prisma/schema.prisma`

## 🔌 Intégrations

### E-commerce
- Shopify
- WooCommerce
- Stripe

### AI
- OpenAI (GPT-4, DALL-E 3)
- Replicate (optionnel)

### Storage
- Cloudinary (images)
- S3/R2 (fichiers)

### Email
- SendGrid
- Mailgun (fallback)

## 📈 Scaling Strategy

### Horizontal Scaling
- Stateless services
- Load balancing
- CDN pour assets

### Vertical Scaling
- Database optimization
- Caching strategy
- Query optimization

### Performance
- Code splitting
- Lazy loading
- Image optimization
- Bundle optimization

## 🔍 Décisions Techniques (ADRs)

### Pourquoi Next.js 15?
- App Router moderne
- Server Components
- Excellent SEO
- Vercel integration

### Pourquoi tRPC?
- Type-safety end-to-end
- Auto-complétion
- Réduction d'erreurs
- Developer experience

### Pourquoi Prisma?
- Type-safety
- Migrations
- Excellent DX
- Performance

### Pourquoi Supabase Auth?
- Gestion complète auth
- OAuth intégré
- Row Level Security
- Scalable

## 🧪 Testing

### Tests Unitaires
- **Framework:** Vitest
- **Location:** `apps/frontend/src/**/__tests__/`
- **Coverage:** Objectif 70%+ pour code critique
- **Guide:** `apps/frontend/tests/TESTING_GUIDE.md`

### Tests E2E
- **Framework:** Playwright
- **Location:** `apps/frontend/tests/e2e/`
- **Browsers:** Chrome, Firefox, Safari
- **Workflows:** Registration, Checkout, Upload/Export

### CI/CD
- **Pipeline:** GitHub Actions
- **Guide:** `.github/workflows/CI_CD_GUIDE.md`
- **Jobs:** Lint, Tests, Build, Deploy
- **Cache:** Optimisé (pnpm, Playwright, Next.js)

## 📚 Documentation

### Fichiers Principaux
- **README.md** - Vue d'ensemble
- **SETUP.md** - Guide d'installation
- **ARCHITECTURE.md** - Ce document
- **CONTRIBUTING.md** - Guide de contribution
- **docs/API_DOCUMENTATION.md** - Documentation API

### Guides Techniques
- **TESTING_GUIDE.md** - Guide de tests
- **CI_CD_GUIDE.md** - Guide CI/CD
- **MONITORING_GUIDE.md** - Guide monitoring

---

**Dernière mise à jour**: Décembre 2024

