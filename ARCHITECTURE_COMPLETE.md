# 🏗️ ARCHITECTURE COMPLÈTE - LUNEO PLATFORM

**Version:** 2.0.0  
**Date:** Novembre 2025  
**Status:** ✅ Production Ready

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Monorepo](#architecture-monorepo)
3. [Applications](#applications)
4. [Packages Partagés](#packages-partagés)
5. [Infrastructure](#infrastructure)
6. [Base de Données](#base-de-données)
7. [Services Externes](#services-externes)
8. [Sécurité](#sécurité)
9. [Déploiement](#déploiement)
10. [Monitoring & Observabilité](#monitoring--observabilité)
11. [Flux de Données](#flux-de-données)
12. [Scripts & Automatisation](#scripts--automatisation)

---

## 🎯 Vue d'ensemble

### Informations Générales

| Propriété | Valeur |
|-----------|--------|
| **Nom** | Luneo Platform |
| **Type** | Plateforme SaaS B2B de personnalisation de produits avec IA |
| **Architecture** | Monorepo (Turborepo + pnpm) |
| **Langages** | TypeScript (100%) |
| **Gestionnaire de Paquets** | pnpm 10.20.0 |
| **Build System** | Turborepo 2.0 |
| **Node.js** | >= 20.0.0 |

### Stack Technologique Principale

```
Frontend:     Next.js 15, React 18, TypeScript 5.3, Tailwind CSS 3.4
Backend:      NestJS 10, Prisma 5, PostgreSQL, Redis, BullMQ
Mobile:       React Native, Expo
AR/3D:        Three.js, React Three Fiber, WebXR, MediaPipe
IA:           OpenAI (GPT-4, DALL-E 3), Worker BullMQ
Auth:         Supabase Auth, JWT, OAuth 2.0 (Google, GitHub)
Payments:     Stripe (Checkout, Subscriptions, Webhooks)
Email:        SendGrid, Mailgun
Storage:      Cloudinary, AWS S3
Monitoring:   Sentry, Vercel Analytics, Prometheus, Grafana
CI/CD:        GitHub Actions, Vercel, Docker
Infrastructure: Terraform, Kubernetes, AWS Multi-Region
```

---

## 🏗️ Architecture Monorepo

### Structure Racine

```
luneo-platform/
├── apps/                          # Applications principales
│   ├── frontend/                  # Next.js 15 (580 fichiers)
│   ├── backend/                   # NestJS API (213 fichiers)
│   ├── mobile/                    # React Native App
│   ├── ar-viewer/                 # AR Mobile Viewer
│   ├── worker-ia/                 # AI Generation Worker
│   ├── widget/                    # Widget Embeddable SDK
│   └── shopify/                   # Shopify App Integration
│
├── packages/                       # Packages partagés
│   ├── types/                     # Types TypeScript partagés
│   ├── ui/                        # Composants UI réutilisables
│   ├── sdk/                       # SDK JavaScript
│   ├── billing-plans/             # Plans de facturation
│   ├── ai-safety/                 # Sécurité IA
│   ├── ar-export/                 # Export AR (USDZ, GLTF)
│   ├── virtual-try-on/            # Virtual Try-On SDK
│   ├── bulk-generator/            # Générateur en masse
│   ├── optimization/              # Optimisations (cache, matériaux)
│   └── tsconfig/                  # Configurations TypeScript
│
├── infrastructure/                 # Infrastructure as Code
│   ├── terraform/                 # Terraform (AWS Multi-Region)
│   └── kubernetes/                # Kubernetes Manifests
│
├── scripts/                        # Scripts d'automatisation (65+)
│   ├── db/                        # Scripts base de données
│   ├── security/                  # Scripts sécurité
│   └── backup/                    # Scripts backup
│
├── docs/                          # Documentation complète
│   ├── api/                       # Documentation API
│   ├── security/                 # Documentation sécurité
│   ├── observability/            # Monitoring & Observabilité
│   └── infrastructure/            # Infrastructure docs
│
├── monitoring/                    # Configurations monitoring
├── logs/                          # Logs locaux
├── docker-compose.yml             # Services Docker dev
├── turbo.json                     # Configuration Turborepo
├── pnpm-workspace.yaml            # Configuration pnpm workspace
└── package.json                   # Root package.json
```

### Gestion des Dépendances

- **Workspace Manager:** pnpm workspaces
- **Build Orchestration:** Turborepo
- **Cache:** Turborepo Remote Cache
- **Dépendances Partagées:** `workspace:*` protocol

---

## 📱 Applications

### 1. Frontend (`apps/frontend/`)

**Type:** Next.js 15 Application (App Router)  
**Port:** 3000  
**Fichiers:** 580+ (351 TSX, 187 TS)

#### Structure

```
apps/frontend/
├── src/
│   ├── app/                       # App Router (200+ pages)
│   │   ├── (auth)/                # Routes authentification
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   ├── (dashboard)/          # Dashboard protégé
│   │   │   ├── overview/
│   │   │   ├── ai-studio/
│   │   │   ├── 3d-view/
│   │   │   ├── ar-studio/
│   │   │   ├── virtual-try-on/
│   │   │   ├── customize/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── library/
│   │   │   ├── templates/
│   │   │   ├── analytics/
│   │   │   ├── billing/
│   │   │   ├── team/
│   │   │   ├── integrations-dashboard/
│   │   │   ├── settings/
│   │   │   └── monitoring/
│   │   │
│   │   ├── (public)/              # Pages publiques
│   │   │   ├── page.tsx           # Homepage
│   │   │   ├── pricing/
│   │   │   ├── solutions/         # 12 solutions
│   │   │   ├── industries/        # 8 industries
│   │   │   ├── integrations/      # 7 intégrations
│   │   │   ├── help/              # 143 pages help
│   │   │   ├── legal/
│   │   │   ├── about/
│   │   │   └── ... (50+ pages)
│   │   │
│   │   └── api/                   # API Routes Next.js
│   │       ├── auth/
│   │       ├── billing/
│   │       ├── designs/
│   │       ├── products/
│   │       ├── ai/
│   │       ├── ar/
│   │       ├── 3d/
│   │       └── ... (30+ routes)
│   │
│   ├── components/                # Composants React
│   │   ├── ui/                    # Composants UI (shadcn/ui)
│   │   ├── navigation/            # Navigation
│   │   ├── dashboard/             # Composants dashboard
│   │   ├── 3d-configurator/       # Configurateur 3D
│   │   ├── Customizer/            # Éditeur visuel
│   │   ├── virtual-tryon/         # Virtual Try-On
│   │   └── ar/                    # Composants AR
│   │
│   ├── lib/                       # Bibliothèques utilitaires
│   │   ├── supabase/              # Client Supabase
│   │   ├── hooks/                 # Hooks React personnalisés
│   │   ├── utils/                 # Utilitaires
│   │   ├── validations/           # Schémas Zod
│   │   ├── canvas-editor/         # Éditeur canvas
│   │   ├── 3d-configurator/       # Logique 3D
│   │   └── virtual-tryon/         # Logique Try-On
│   │
│   ├── hooks/                     # Hooks globaux
│   ├── store/                     # State management (Zustand)
│   ├── contexts/                  # Contextes React
│   ├── services/                  # Services API
│   ├── types/                     # Types TypeScript
│   └── styles/                    # Styles globaux
│
├── public/                        # Assets statiques
│   ├── favicon.svg
│   ├── icon.svg
│   ├── apple-touch-icon.png
│   └── manifest.json
│
├── tests/                         # Tests
│   ├── e2e/                       # Tests E2E Playwright
│   │   ├── workflows/
│   │   └── utils/
│   └── unit/                      # Tests unitaires Vitest
│
├── next.config.mjs                # Configuration Next.js
├── tailwind.config.cjs            # Configuration Tailwind
├── playwright.config.ts           # Configuration Playwright
└── package.json
```

#### Technologies Clés

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **UI:** Tailwind CSS, Radix UI, shadcn/ui, Framer Motion
- **State:** Zustand, React Query (TanStack Query)
- **3D:** Three.js, React Three Fiber, @react-three/drei
- **2D Editor:** Konva.js, react-konva
- **AR:** MediaPipe (Face Mesh, Hands), WebXR
- **IA:** OpenAI SDK
- **Auth:** Supabase Auth (SSR)
- **Payments:** Stripe
- **Forms:** React Hook Form, Zod
- **Charts:** Recharts, Nivo
- **Testing:** Playwright (E2E), Vitest (Unit)

#### Fonctionnalités Principales

- ✅ **200+ Pages** complètes (public + dashboard)
- ✅ **Authentification** complète (Email, OAuth Google/GitHub)
- ✅ **Dashboard** interactif avec analytics
- ✅ **3D Configurator** (Three.js)
- ✅ **Visual Customizer** (Konva.js)
- ✅ **Virtual Try-On** (MediaPipe)
- ✅ **AI Studio** (Génération d'images DALL-E)
- ✅ **Pricing & Billing** (Stripe Checkout)
- ✅ **Intégrations** (Shopify, WooCommerce, etc.)
- ✅ **RGPD Compliant** (Cookies, Privacy)

---

### 2. Backend (`apps/backend/`)

**Type:** NestJS 10 API REST  
**Port:** 3001  
**Fichiers:** 213+ fichiers TypeScript

#### Structure

```
apps/backend/
├── src/
│   ├── main.ts                    # Point d'entrée
│   ├── app.module.ts              # Module racine
│   │
│   ├── modules/                   # 18 modules métier
│   │   ├── auth/                  # Authentification
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/        # Passport strategies
│   │   │   └── guards/            # Guards JWT
│   │   │
│   │   ├── users/                 # Gestion utilisateurs
│   │   ├── brands/                # Gestion marques
│   │   ├── products/              # Gestion produits
│   │   ├── designs/               # Gestion designs
│   │   ├── orders/                # Gestion commandes
│   │   │
│   │   ├── ai/                    # Service IA
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   └── services/          # Services IA spécialisés
│   │   │
│   │   ├── billing/               # Facturation Stripe
│   │   │   ├── billing.controller.ts
│   │   │   ├── billing.service.ts
│   │   │   └── services/          # Services Stripe
│   │   │
│   │   ├── ecommerce/             # Intégrations e-commerce
│   │   │   ├── connectors/        # Connecteurs (Shopify, WooCommerce)
│   │   │   └── services/          # Services synchronisation
│   │   │
│   │   ├── product-engine/        # Moteur de produits
│   │   ├── render/                # Service de rendu
│   │   ├── production/            # Service de production
│   │   ├── integrations/          # Intégrations externes
│   │   ├── webhooks/              # Gestion webhooks
│   │   ├── email/                 # Service email (SendGrid/Mailgun)
│   │   ├── analytics/             # Analytics
│   │   ├── feature-flags/         # Feature flags
│   │   ├── plans/                 # Plans de facturation
│   │   ├── usage-billing/        # Usage & quotas
│   │   ├── security/              # Sécurité
│   │   ├── public-api/            # API publique
│   │   ├── health/                # Health checks
│   │   └── admin/                 # Administration
│   │
│   ├── common/                    # Code commun
│   │   ├── decorators/            # Décorateurs personnalisés
│   │   ├── guards/                # Guards (JWT, Quota, Roles)
│   │   ├── interceptors/           # Interceptors
│   │   ├── filters/               # Exception filters
│   │   ├── logger/                # Logging (Winston, CloudWatch)
│   │   └── utils/                 # Utilitaires
│   │
│   ├── libs/                      # Bibliothèques internes
│   │   ├── prisma/                # Service Prisma
│   │   ├── redis/                 # Service Redis
│   │   ├── cache/                 # Cache intelligent
│   │   ├── s3/                    # Service S3
│   │   └── storage/               # Storage (Cloudinary)
│   │
│   ├── config/                    # Configuration
│   │   ├── configuration.ts       # Configuration centralisée
│   │   └── email-domain-config.ts
│   │
│   ├── jobs/                      # Jobs & Queues
│   │   ├── queues/                # Queues BullMQ
│   │   ├── workers/               # Workers
│   │   │   ├── design/            # Worker designs
│   │   │   ├── render/            # Worker rendu
│   │   │   └── production/        # Worker production
│   │   └── services/             # Services queues
│   │
│   └── pages/                     # Pages statiques
│
├── prisma/
│   ├── schema.prisma              # Schéma Prisma
│   ├── migrations/                # Migrations
│   └── seed.ts                    # Seed database
│
├── test/                          # Tests
│   ├── e2e/                       # Tests E2E
│   └── unit/                      # Tests unitaires
│
├── api/                           # Vercel API handlers
├── Dockerfile                     # Dockerfile production
├── nest-cli.json                  # Configuration NestJS
└── package.json
```

#### Technologies Clés

- **Framework:** NestJS 10
- **ORM:** Prisma 5
- **Database:** PostgreSQL (Supabase)
- **Cache:** Redis (Upstash)
- **Queues:** BullMQ
- **Auth:** JWT, Passport, bcrypt
- **Payments:** Stripe SDK
- **Email:** SendGrid, Mailgun, SMTP
- **Storage:** AWS S3, Cloudinary
- **Monitoring:** Sentry, Prometheus
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI

#### Modules Principaux

1. **Auth Module:** JWT, Refresh Tokens, OAuth
2. **Billing Module:** Stripe Checkout, Subscriptions, Webhooks
3. **AI Module:** Intégration OpenAI, génération d'images
4. **Ecommerce Module:** Connecteurs Shopify, WooCommerce
5. **Product Engine:** Gestion produits, variantes
6. **Render Module:** Rendu d'images, PDF
7. **Production Module:** Production de commandes
8. **Usage Billing:** Quotas, limites, facturation usage

---

### 3. Mobile (`apps/mobile/`)

**Type:** React Native App (Expo)  
**Fichiers:** 20+ fichiers

#### Structure

```
apps/mobile/
├── src/
│   ├── screens/                   # Écrans
│   ├── components/                # Composants
│   ├── navigation/               # Navigation
│   └── services/                  # Services API
├── App.tsx                        # Point d'entrée
├── app.json                       # Configuration Expo
└── package.json
```

#### Technologies

- React Native
- Expo
- TypeScript

---

### 4. Worker IA (`apps/worker-ia/`)

**Type:** BullMQ Worker (Node.js)  
**Rôle:** Traitement asynchrone des tâches IA

#### Structure

```
apps/worker-ia/
├── src/
│   ├── ai-worker/                 # Worker génération IA
│   ├── render-worker/            # Worker rendu
│   └── ...
├── Dockerfile.dev
└── package.json
```

#### Fonctionnalités

- Génération d'images IA (DALL-E)
- Traitement d'images (Sharp)
- Rendu de designs
- Traitement asynchrone via BullMQ

---

### 5. Widget (`apps/widget/`)

**Type:** React SDK Embeddable  
**Build:** Vite

#### Structure

```
apps/widget/
├── src/
│   ├── components/                # Composants widget
│   └── ...
├── dist/                          # Build output
├── vite.config.ts
└── package.json
```

#### Fonctionnalités

- Widget embeddable (iframe/SDK)
- Personnalisation produits
- Intégration e-commerce

---

### 6. AR Viewer (`apps/ar-viewer/`)

**Type:** WebAR Viewer  
**Build:** TypeScript + tsup

#### Structure

```
apps/ar-viewer/
├── src/
│   ├── ARQuickLook.ts            # AR Quick Look (iOS)
│   ├── SceneViewer.ts            # Scene Viewer (Android)
│   ├── USDZConverter.ts          # Conversion USDZ
│   └── WebXRViewer.ts            # WebXR
├── dist/
└── package.json
```

#### Fonctionnalités

- AR Quick Look (iOS)
- Scene Viewer (Android)
- WebXR
- Conversion USDZ/GLTF

---

### 7. Shopify App (`apps/shopify/`)

**Type:** Shopify App (NestJS)  
**Rôle:** Intégration Shopify

#### Structure

```
apps/shopify/
├── src/
│   ├── app.module.ts
│   └── ...
├── shopify.app.toml
└── package.json
```

#### Fonctionnalités

- Installation app Shopify
- Synchronisation produits
- Webhooks Shopify
- OAuth Shopify

---

## 📦 Packages Partagés

### 1. `@luneo/types`

**Rôle:** Types TypeScript partagés

```typescript
// Types AR, Widget, etc.
export interface ARConfig { ... }
export interface WidgetConfig { ... }
```

---

### 2. `@luneo/ui`

**Rôle:** Composants UI réutilisables

- Composants basés sur shadcn/ui
- Utilitaires (cn, utils)

---

### 3. `@luneo/sdk`

**Rôle:** SDK JavaScript pour intégrations

- Client API
- Types partagés
- Utilitaires

---

### 4. `@luneo/billing-plans`

**Rôle:** Plans de facturation

- Définition des plans
- Types de plans
- Utilitaires pricing

---

### 5. `@luneo/ai-safety`

**Rôle:** Sécurité IA

- Sanitisation de prompts
- Détection de contenu inapproprié
- Patterns de sécurité

---

### 6. `@luneo/ar-export`

**Rôle:** Export AR

- Conversion USDZ
- Conversion GLTF
- AR Quick Look
- Scene Viewer

---

### 7. `@luneo/virtual-try-on`

**Rôle:** Virtual Try-On SDK

- Face tracking (MediaPipe)
- Hand tracking
- Overlay de produits
- Rendu 3D

---

### 8. `@luneo/bulk-generator`

**Rôle:** Générateur en masse

- Traitement batch
- Génération multiple

---

### 9. `@luneo/optimization`

**Rôle:** Optimisations

- Cache manager
- Materials manager
- Print exporter
- Text engraver

---

## 🗄️ Base de Données

### Schéma Prisma

**Database:** PostgreSQL (Supabase)  
**ORM:** Prisma 5

#### Modèles Principaux

```prisma
// Utilisateurs
User {
  id, email, password, firstName, lastName
  role (CONSUMER, BRAND_USER, BRAND_ADMIN, PLATFORM_ADMIN)
  stripeCustomerId, stripeSubscriptionId
  brandId → Brand
}

// Marques
Brand {
  id, name, slug, status
  stripeAccountId
  users → User[]
  products → Product[]
}

// Produits
Product {
  id, name, description, price
  brandId → Brand
  variants → ProductVariant[]
  designs → Design[]
}

// Designs
Design {
  id, name, status (PENDING, PROCESSING, COMPLETED, FAILED)
  userId → User
  productId → Product
  aiPrompt, imageUrl
}

// Commandes
Order {
  id, status (CREATED, PAID, PROCESSING, SHIPPED, DELIVERED)
  userId → User
  items → OrderItem[]
  stripePaymentIntentId
}

// Plans
Plan {
  id, name, priceMonthly, priceYearly
  features → PlanFeature[]
}

// Usage & Quotas
UsageQuota {
  id, userId → User
  planId → Plan
  currentUsage, limit
}
```

#### Enums

- `UserRole`: CONSUMER, BRAND_USER, BRAND_ADMIN, PLATFORM_ADMIN, FABRICATOR
- `OrderStatus`: CREATED, PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- `DesignStatus`: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- `PaymentStatus`: PENDING, SUCCEEDED, FAILED, CANCELLED, REFUNDED
- `BrandStatus`: ACTIVE, SUSPENDED, PENDING_VERIFICATION, VERIFIED

---

## 🔌 Services Externes

### Authentification

- **Supabase Auth:** Authentification principale
  - Email/Password
  - OAuth (Google, GitHub)
  - JWT tokens
  - Refresh tokens

### Paiements

- **Stripe:**
  - Checkout Sessions
  - Subscriptions
  - Webhooks
  - Customer Portal

### Email

- **SendGrid:** Email principal
- **Mailgun:** Email alternatif
- **SMTP:** Fallback

### Storage

- **Cloudinary:** Images, transformations
- **AWS S3:** Fichiers, backups

### IA

- **OpenAI:**
  - GPT-4 (text)
  - DALL-E 3 (images)

### Monitoring

- **Sentry:** Error tracking
- **Vercel Analytics:** Analytics frontend
- **Prometheus:** Métriques backend
- **Grafana:** Dashboards

### Cache

- **Redis (Upstash):** Cache, sessions, queues

---

## 🔒 Sécurité

### Authentification

- JWT avec refresh tokens
- OAuth 2.0 (Google, GitHub)
- Rate limiting
- CSRF protection

### Autorisation

- Guards NestJS (JWT, Roles, Quota)
- RBAC (Role-Based Access Control)
- Multi-tenant isolation

### Protection

- Helmet (headers sécurité)
- CORS configuré
- Input validation (class-validator, Zod)
- SQL injection protection (Prisma)
- XSS protection

### Conformité

- RGPD compliant
- Cookie consent
- Privacy policy
- Data encryption

---

## 🚀 Déploiement

### Frontend (Vercel)

**URL Production:** https://app.luneo.app

```bash
# Configuration Vercel
Root Directory: apps/frontend
Build Command: cd ../.. && pnpm install --filter=@luneo/frontend && pnpm run build --filter=@luneo/frontend
Install Command: cd ../.. && pnpm install --frozen-lockfile
Output Directory: .next
```

**Variables d'environnement:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_PUBLIC_KEY`
- etc.

---

### Backend (Hetzner / AWS)

**Options de déploiement:**
1. Hetzner (Docker)
2. AWS ECS/EKS
3. Railway
4. Vercel Serverless Functions

**Configuration:**
- Dockerfile disponible
- docker-compose.production.yml
- Scripts de déploiement

---

### Infrastructure

**Terraform:**
- AWS Multi-Region
- EKS (Kubernetes)
- RDS (PostgreSQL)
- S3 (Storage)
- CloudWatch (Logs)

**Kubernetes:**
- Manifests dans `infrastructure/kubernetes/`
- GitOps (ArgoCD)
- Multi-cluster

---

## 📊 Monitoring & Observabilité

### Logging

- **Winston:** Logging backend
- **CloudWatch:** Logs centralisés AWS
- **Structured Logs:** JSON format

### Métriques

- **Prometheus:** Métriques backend
- **Grafana:** Dashboards
- **Vercel Analytics:** Métriques frontend

### Tracing

- **OpenTelemetry:** Distributed tracing
- **Sentry:** Error tracking
- **Performance Monitoring:** APM

### Alertes

- **Prometheus Alerts:** Alertes métriques
- **Sentry Alerts:** Alertes erreurs
- **Uptime Monitoring:** Better Uptime

---

## 🔄 Flux de Données

### Flux Principal - Génération Design

```
1. User → Frontend (Next.js)
2. Frontend → Backend API (POST /api/designs)
3. Backend → Queue (BullMQ)
4. Worker IA → OpenAI API
5. Worker IA → Cloudinary (Upload)
6. Worker IA → Database (Update Design)
7. Backend → WebSocket (Notification)
8. Frontend → Display Design
```

### Flux E-commerce

```
1. User → Widget (Embedded)
2. Widget → Backend API
3. Backend → E-commerce Connector (Shopify/WooCommerce)
4. Connector → Sync Products
5. Backend → Database (Store Products)
6. Widget → Display Products
```

### Flux Paiement

```
1. User → Frontend (Pricing Page)
2. Frontend → Backend API (POST /api/billing/create-checkout-session)
3. Backend → Stripe API (Create Checkout Session)
4. Stripe → User (Redirect to Checkout)
5. User → Stripe (Payment)
6. Stripe → Backend (Webhook)
7. Backend → Database (Update Subscription)
8. Backend → Frontend (Redirect Success)
```

---

## 🛠️ Scripts & Automatisation

### Scripts Disponibles (65+)

**Base de données:**
- `scripts/db/bootstrap-local.sh` - Setup DB local

**Déploiement:**
- `scripts/deploy-production.sh` - Déploiement production
- `scripts/deploy-backend.sh` - Déploiement backend

**Tests:**
- `scripts/test-all.sh` - Tous les tests
- `scripts/validate-everything.sh` - Validation complète

**Sécurité:**
- `scripts/security/run-zap-baseline.sh` - Audit sécurité

**Autres:**
- `scripts/check-health.sh` - Health checks
- `scripts/verify-stripe-pricing.ts` - Vérification Stripe

### Makefile

```bash
make setup          # Setup complet
make dev            # Lancer dev servers
make build          # Build production
make test           # Tous les tests
make test-e2e       # Tests E2E
make docker-up      # Démarrer Docker services
make docker-down    # Arrêter Docker services
make health         # Health check
make deploy         # Déployer production
make db-studio      # Ouvrir Prisma Studio
```

---

## 📈 Statistiques du Projet

### Code

- **Total Fichiers:** 1000+
- **Frontend:** 580 fichiers (351 TSX, 187 TS)
- **Backend:** 213 fichiers TypeScript
- **Packages:** 10 packages partagés
- **Scripts:** 65+ scripts

### Pages

- **Pages Publiques:** 200+
- **Pages Dashboard:** 20+
- **Pages Help:** 143
- **API Routes:** 30+

### Tests

- **Tests E2E:** Playwright
- **Tests Unitaires:** Vitest
- **Coverage:** En cours d'amélioration

---

## 🎯 Points Clés de l'Architecture

### ✅ Forces

1. **Monorepo bien structuré** avec Turborepo
2. **Séparation claire** des responsabilités
3. **TypeScript 100%** pour la sécurité des types
4. **Scalabilité** avec queues BullMQ
5. **Observabilité** complète (logs, métriques, tracing)
6. **Sécurité** robuste (auth, validation, protection)
7. **Documentation** complète

### 🔄 Améliorations Futures

1. **Tests:** Augmenter la couverture
2. **Performance:** Optimisations supplémentaires
3. **Monitoring:** Dashboards avancés
4. **CI/CD:** Pipeline complet
5. **Multi-région:** Déploiement global

---

## 📚 Documentation Complémentaire

- `ARCHITECTURE_MONOREPO.md` - Détails monorepo
- `ARCHITECTURE_TECHNIQUE_COMPLETE.md` - Architecture technique
- `docs/ARCHITECTURE_UNIFIED.md` - Architecture unifiée
- `apps/backend/ARCHITECTURE.md` - Architecture backend
- `README.md` - Guide de démarrage

---

**✅ Architecture complète et production-ready !**

**Dernière mise à jour:** Novembre 2025

