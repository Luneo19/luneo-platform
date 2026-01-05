# 🏗️ PLAN D'IMPLÉMENTATION - SOCLE 3D/AR + PERSONNALISATION + IA + PRODUCTION

**Version**: 1.0.0  
**Date**: Décembre 2024  
**Objectif**: Implémentation world-class SaaS du socle complet sans casser l'existant

---

## 📋 TABLE DES MATIÈRES

1. [Décisions d'Architecture](#1-décisions-darchitecture)
2. [Modèle de Données Prisma](#2-modèle-de-données-prisma)
3. [Backend NestJS - Modules](#3-backend-nestjs---modules)
4. [Workers BullMQ](#4-workers-bullmq)
5. [Widget Implementation](#5-widget-implementation)
6. [Intégrations & Ops](#6-intégrations--ops)
7. [Plan File-by-File](#7-plan-file-by-file)

---

## 1. DÉCISIONS D'ARCHITECTURE

### 1.1 Source of Truth - Authentification

**DÉCISION FINALE** : **Hybrid Supabase + NestJS JWT**

**Architecture actuelle** :
- **Frontend** : Supabase Auth (session management, OAuth)
- **Backend NestJS** : JWT via Passport (API authentication)
- **Synchronisation** : `User.id` (Prisma) = `auth.users.id` (Supabase)

**Pattern à maintenir** :
```typescript
// Frontend: apps/frontend/src/lib/auth/get-user.ts
// - Vérifie Supabase session
// - Récupère User depuis Prisma avec userId = supabaseUser.id

// Backend: apps/backend/src/modules/auth/strategies/jwt.strategy.ts
// - Valide JWT token
// - Récupère User depuis Prisma
// - Retourne CurrentUser avec brandId
```

**Recommandation** :
- ✅ **Garder Supabase Auth** pour le frontend (OAuth, sessions, password reset)
- ✅ **Garder NestJS JWT** pour le backend API (performance, contrôle)
- ✅ **Synchronisation automatique** : Créer User dans Prisma lors de la première connexion Supabase
- ✅ **Widget public** : Utiliser API Keys (déjà existant) pour authentification widget

**Fichiers à modifier** :
- `apps/backend/src/modules/auth/auth.service.ts` : Ajouter sync Supabase → Prisma
- `apps/frontend/src/lib/auth/sync-user.ts` : Nouveau service de synchronisation

---

### 1.2 Multi-Tenancy - Brand = Tenant

**DÉCISIONS** :

1. **Scoping** : Toutes les requêtes sont filtrées par `brandId`
   - Guards automatiques via `@BrandScoped()` decorator
   - Index sur `brandId` pour toutes les tables tenant-scoped

2. **Isolation** :
   - **Application-level** : Guards NestJS vérifient `currentUser.brandId`
   - **Database-level** : RLS (Row Level Security) PostgreSQL (optionnel, déjà préparé)

3. **Index requis** :
   ```prisma
   @@index([brandId]) // Sur toutes les tables tenant-scoped
   @@index([brandId, status]) // Composite pour queries fréquentes
   @@index([brandId, createdAt]) // Pour pagination
   ```

4. **Pattern de scoping** :
   ```typescript
   // Guard existant à réutiliser
   @UseGuards(JwtAuthGuard, RolesGuard)
   @BrandScoped() // Nouveau decorator
   async findAll(@CurrentUser() user: CurrentUser) {
     // brandId automatiquement injecté depuis user.brandId
   }
   ```

**Fichiers à créer** :
- `apps/backend/src/common/decorators/brand-scoped.decorator.ts`
- `apps/backend/src/common/guards/brand-scoped.guard.ts`

---

### 1.3 Structure Order - Multi-Items

**DÉCISION FINALE** : **Migrer vers OrderItem (backward compatible)**

**État actuel** :
- Schema Prisma : `Order` a `designId` et `productId` directement (1 order = 1 item)
- Frontend TypeScript : Définit déjà `OrderItem[]` (incohérence)
- Services : `OrdersService.create()` crée 1 order = 1 design

**Recommandation** :
1. **Créer modèle `OrderItem`** dans Prisma
2. **Migration backward compatible** :
   - Garder `Order.designId` et `Order.productId` (nullable, deprecated)
   - Créer `OrderItem` pour chaque order existant
   - Nouveaux orders utilisent uniquement `OrderItem[]`
3. **Plan de migration** :
   ```sql
   -- Migration 1: Créer OrderItem
   -- Migration 2: Migrer données existantes
   -- Migration 3: Rendre designId/productId nullable (après validation)
   ```

**Schema Prisma à ajouter** :
```prisma
model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  designId    String?  // Nullable si pas de design
  snapshotId  String?  // Nouveau: lien vers Snapshot
  quantity    Int      @default(1)
  priceCents  Int      // Prix unitaire au moment de la commande
  totalCents  Int      // priceCents * quantity
  metadata    Json?    // Customization options, etc.
  
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Restrict)
  design  Design? @relation(fields: [designId], references: [id], onDelete: SetNull)
  snapshot Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)
  
  @@index([orderId])
  @@index([productId])
  @@index([designId])
  @@index([snapshotId])
}
```

**Fichiers à modifier** :
- `apps/backend/prisma/schema.prisma` : Ajouter OrderItem
- `apps/backend/src/modules/orders/orders.service.ts` : Adapter pour OrderItem[]
- Migration Prisma : `apps/backend/prisma/migrations/YYYYMMDDHHMMSS_add_order_items/migration.sql`

---

## 2. MODÈLE DE DONNÉES PRISMA

### 2.1 Nouveaux Modèles

#### DesignSpec (Versionné, Déterministe)

```prisma
model DesignSpec {
  id          String   @id @default(cuid())
  specVersion String   @default("1.0.0") // Semantic versioning
  specHash    String   @unique // SHA256 du spec canonique
  spec        Json     // JSON Schema validé, format canonique
  productId   String
  zoneInputs  Json     // { zoneId: { text, font, color, size, effect, ... } }
  metadata    Json?    // Provenance (widget, shopify, api), userAgent, etc.
  
  // Relations
  productId_fk String
  product      Product @relation("ProductSpecs", fields: [productId_fk], references: [id], onDelete: Cascade)
  
  snapshots    Snapshot[]
  designs      Design[] // Designs générés depuis ce spec
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([specHash])
  @@index([productId_fk])
  @@index([specVersion])
  @@index([createdAt])
}
```

**Pourquoi** :
- **Déterministe** : Même specHash = mêmes outputs (cache)
- **Versionné** : Évolution du format sans casser l'existant
- **Canonique** : JSON normalisé (ordre des clés, whitespace) pour hash stable

---

#### Snapshot (Immuable, Point-in-Time)

```prisma
model Snapshot {
  id          String   @id @default(cuid())
  specId      String   // Lien vers DesignSpec
  specHash    String   // Dupliqué pour queries rapides
  spec        Json     // Dupliqué pour immutabilité (snapshot du spec au moment T)
  
  // Previews & Exports
  previewUrl      String? // 2D preview (PNG/WebP)
  preview3dUrl    String? // 3D preview (GLTF viewer)
  thumbnailUrl    String? // Thumbnail 200x200
  
  // Production Assets
  productionBundleUrl String? // ZIP avec SVG/DXF/PDF
  arModelUrl          String? // USDZ pour AR
  gltfModelUrl       String? // GLTF pour 3D viewer
  
  // Asset Versions (pour traçabilité)
  assetVersions Json? // [{ url, format, size, hash, createdAt }]
  
  // Validation & Lock
  isValidated Boolean  @default(false)
  validatedBy String? // User ID
  validatedAt DateTime?
  isLocked    Boolean  @default(false) // Lock pour empêcher modifications
  lockedAt    DateTime?
  
  // Audit
  createdBy   String? // User ID ou 'widget' ou 'api'
  provenance  Json?   // { source: 'widget'|'shopify'|'api', sessionId, ipAddress, userAgent }
  
  // Relations
  spec        DesignSpec @relation(fields: [specId], references: [id], onDelete: Restrict)
  orders      OrderItem[] // Orders qui utilisent ce snapshot
  workOrders  WorkOrder[] // WorkOrders liés
  renderResults RenderResult[] // Via renderId (string) ou relation directe
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt // Ne devrait jamais changer (immuable)
  
  @@unique([specHash, validatedAt]) // Un snapshot par specHash validé
  @@index([specId])
  @@index([specHash])
  @@index([isValidated])
  @@index([isLocked])
  @@index([createdAt])
  @@index([validatedAt])
}
```

**Pourquoi** :
- **Immuable** : Une fois créé, ne change jamais (audit trail)
- **Point-in-time** : Capture l'état exact au moment de la validation
- **Traçabilité** : Qui, quand, comment, provenance

---

#### RenderResult (Refactor avec Relations)

**État actuel** : `renderId` string loose, pas de relation Prisma

**Refactor proposé** :
```prisma
model RenderResult {
  id           String   @id @default(cuid())
  renderId     String   @unique // Gardé pour backward compatibility
  type         String   // '2d', '3d', 'preview', 'ar', 'manufacturing'
  status       String   // 'pending', 'processing', 'success', 'failed'
  url          String?
  thumbnailUrl String?
  metadata     Json?
  
  // Relations (NOUVEAU)
  snapshotId   String?
  snapshot     Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)
  designId     String?
  design       Design?   @relation(fields: [designId], references: [id], onDelete: SetNull)
  customizationId String?
  customization Customization? @relation(fields: [customizationId], references: [id], onDelete: SetNull)
  
  createdAt    DateTime @default(now())
  
  @@index([renderId])
  @@index([type])
  @@index([status])
  @@index([snapshotId]) // NOUVEAU
  @@index([designId])   // NOUVEAU
  @@index([customizationId]) // NOUVEAU
}
```

---

### 2.2 Modifications Modèles Existants

#### Order (Ajout OrderItem relation)

```prisma
model Order {
  // ... champs existants ...
  
  // Relations
  // ... relations existantes ...
  items OrderItem[] // NOUVEAU
  
  // DEPRECATED (garder pour backward compat)
  designId String?  // Rendre nullable
  design   Design?  @relation(fields: [designId], references: [id], onDelete: Cascade)
  productId String? // Rendre nullable
  product   Product? @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

#### Design (Lien vers DesignSpec)

```prisma
model Design {
  // ... champs existants ...
  
  // Relations
  specId   String?
  spec     DesignSpec? @relation(fields: [specId], references: [id], onDelete: SetNull)
  
  // ... autres relations ...
}
```

#### Customization (Lien vers Snapshot)

```prisma
model Customization {
  // ... champs existants ...
  
  // Relations
  snapshotId String?
  snapshot   Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)
  
  // ... autres relations ...
}
```

---

### 2.3 Standardisation Argent

**DÉCISION** : **Utiliser `Int` (cents) partout, aligner avec Stripe**

**Raison** :
- Stripe utilise des entiers (cents)
- Évite les erreurs de précision avec Decimal
- Performance meilleure (Int vs Decimal)

**Modifications** :
- ✅ Déjà fait : `Order.subtotalCents`, `Order.totalCents`, etc.
- ✅ À vérifier : `Product.price` est `Decimal` → **Garder Decimal pour affichage**, mais convertir en cents pour calculs

**Pattern** :
```typescript
// Product.price = Decimal(10, 2) pour affichage
// OrderItem.priceCents = Int pour calculs Stripe
const priceCents = Math.round(parseFloat(product.price.toString()) * 100);
```

---

### 2.4 Index & Contraintes

**Index composites pour performance** :
```prisma
// Brand scoping
@@index([brandId, status])
@@index([brandId, createdAt])
@@index([brandId, userId])

// Snapshot queries
@@index([specHash, isValidated])
@@index([isLocked, createdAt])

// Order queries
@@index([brandId, status, createdAt])
@@index([userId, status])

// External IDs (Shopify)
@@index([externalProductId, integrationId])
@@unique([integrationId, externalProductId])
```

---

### 2.5 Diff Schema Prisma Complet

**Fichier** : `apps/backend/prisma/schema.prisma`

**Ajouts** :
1. Modèle `DesignSpec`
2. Modèle `Snapshot`
3. Modèle `OrderItem`
4. Relations dans `Order`, `Design`, `Customization`, `RenderResult`
5. Index supplémentaires

**Voir section 7 pour le diff exact.**

---

### 2.6 Migrations Prisma

**Migration 1** : `20241201000000_add_design_spec_and_snapshot`
- Créer `DesignSpec`
- Créer `Snapshot`
- Ajouter relations dans `Design`

**Migration 2** : `20241201000001_add_order_items`
- Créer `OrderItem`
- Migrer données existantes (Order → OrderItem)
- Rendre `Order.designId` et `Order.productId` nullable

**Migration 3** : `20241201000002_add_snapshot_relations`
- Ajouter `snapshotId` dans `Customization`, `OrderItem`
- Ajouter relations dans `RenderResult`

**Migration 4** : `20241201000003_add_indexes`
- Ajouter index composites pour performance

**Plan de déploiement** :
1. **Staging** : Appliquer migrations, tester
2. **Production** : Backup DB, appliquer migrations en maintenance window
3. **Rollback** : Scripts de rollback préparés (voir section 7)

---

## 3. BACKEND NESTJS - MODULES

### 3.1 Module: Personalization

**Chemin** : `apps/backend/src/modules/personalization/`

**Responsabilités** :
- Rules Engine (validation règles produit)
- Normalisation Unicode (NFD → NFC)
- Caractères autorisés (whitelist)
- Auto-fit (ajustement taille texte)
- Validations (longueur, format, contraintes zone)

**Fichiers** :
```
personalization/
├── personalization.module.ts
├── personalization.controller.ts
├── personalization.service.ts
├── services/
│   ├── rules-engine.service.ts
│   ├── unicode-normalizer.service.ts
│   ├── text-validator.service.ts
│   └── auto-fit.service.ts
├── dto/
│   ├── validate-zone-input.dto.ts
│   └── normalize-text.dto.ts
└── interfaces/
    ├── zone-rule.interface.ts
    └── validation-result.interface.ts
```

**Endpoints** :
- `POST /api/v1/personalization/validate` : Valider inputs zone
- `POST /api/v1/personalization/normalize` : Normaliser texte
- `POST /api/v1/personalization/auto-fit` : Calculer taille auto

---

### 3.2 Module: Specs

**Chemin** : `apps/backend/src/modules/specs/`

**Responsabilités** :
- DesignSpec builder (construction depuis zone inputs)
- Canonicalization (JSON normalisé)
- Hashing SHA256
- Versioning (specVersion)

**Fichiers** :
```
specs/
├── specs.module.ts
├── specs.controller.ts
├── specs.service.ts
├── services/
│   ├── spec-builder.service.ts
│   ├── spec-canonicalizer.service.ts
│   └── spec-hasher.service.ts
├── dto/
│   ├── create-spec.dto.ts
│   └── get-spec.dto.ts
└── schemas/
    └── design-spec.schema.json // JSON Schema validation
```

**Endpoints** :
- `POST /api/v1/specs` : Créer DesignSpec
- `GET /api/v1/specs/:specHash` : Récupérer par hash
- `POST /api/v1/specs/validate` : Valider spec JSON

---

### 3.3 Module: Snapshots

**Chemin** : `apps/backend/src/modules/snapshots/`

**Responsabilités** :
- Créer snapshot (immuable)
- Get snapshot (avec cache)
- Lock snapshot (empêcher modifications)
- Validation snapshot

**Fichiers** :
```
snapshots/
├── snapshots.module.ts
├── snapshots.controller.ts
├── snapshots.service.ts
├── guards/
│   └── snapshot-lock.guard.ts
└── dto/
    ├── create-snapshot.dto.ts
    ├── lock-snapshot.dto.ts
    └── validate-snapshot.dto.ts
```

**Endpoints** :
- `POST /api/v1/snapshots` : Créer snapshot
- `GET /api/v1/snapshots/:id` : Récupérer snapshot
- `POST /api/v1/snapshots/:id/lock` : Verrouiller
- `POST /api/v1/snapshots/:id/validate` : Valider

**Idempotency** : Utiliser `specHash` comme idempotency key

---

### 3.4 Module: Rendering (Extension)

**Chemin** : `apps/backend/src/modules/render/` (existant, à étendre)

**Nouvelles responsabilités** :
- Enqueue jobs (preview, final, AR, manufacturing)
- Statuts (polling, webhooks)
- Récupération previews (cacheable)
- Timeouts (configurables)

**Fichiers à ajouter** :
```
render/
├── services/
│   ├── render-queue.service.ts (NOUVEAU)
│   └── render-status.service.ts (NOUVEAU)
├── dto/
│   ├── enqueue-render.dto.ts (NOUVEAU)
│   └── get-render-status.dto.ts (NOUVEAU)
```

**Endpoints à ajouter** :
- `POST /api/v1/renders/preview` : Enqueue preview render
- `POST /api/v1/renders/final` : Enqueue final render
- `GET /api/v1/renders/:renderId/status` : Statut render
- `GET /api/v1/renders/:renderId/preview` : Récupérer preview (cacheable)

---

### 3.5 Module: Manufacturing

**Chemin** : `apps/backend/src/modules/manufacturing/`

**Responsabilités** :
- Export packs (SVG, DXF, PDF, ZIP)
- WorkOrder integration
- Production bundle generation

**Fichiers** :
```
manufacturing/
├── manufacturing.module.ts
├── manufacturing.controller.ts
├── manufacturing.service.ts
├── services/
│   ├── export-pack.service.ts
│   ├── svg-generator.service.ts
│   ├── dxf-generator.service.ts
│   └── pdf-generator.service.ts
└── dto/
    ├── export-pack.dto.ts
    └── generate-bundle.dto.ts
```

**Endpoints** :
- `POST /api/v1/manufacturing/export-pack` : Générer pack export
- `GET /api/v1/manufacturing/bundles/:orderId` : Récupérer bundle production
- `POST /api/v1/manufacturing/work-orders/:id/export` : Export pour WorkOrder

---

### 3.6 Module: Shopify (Extension)

**Chemin** : `apps/backend/src/modules/ecommerce/` (existant, à étendre)

**Nouvelles responsabilités** :
- Line item properties (customization data)
- Webhooks order paid (créer Order depuis Shopify)
- Sync produit (ProductMapping)

**Fichiers à ajouter** :
```
ecommerce/
├── services/
│   ├── shopify-line-items.service.ts (NOUVEAU)
│   └── shopify-webhook-handler.service.ts (NOUVEAU)
├── controllers/
│   └── shopify-webhooks.controller.ts (NOUVEAU)
└── dto/
    ├── shopify-order.dto.ts (NOUVEAU)
    └── line-item-properties.dto.ts (NOUVEAU)
```

**Endpoints à ajouter** :
- `POST /api/v1/webhooks/shopify/orders/paid` : Webhook Shopify (signed)
- `POST /api/v1/webhooks/shopify/products/update` : Webhook produit

**Sécurité** : Signature HMAC Shopify (voir section 6)

---

### 3.7 Module: Billing (Extension)

**Chemin** : `apps/backend/src/modules/billing/` (existant, à étendre)

**Nouvelles responsabilités** :
- Stripe intents (PaymentIntent)
- Webhooks Stripe (signed)
- Credits (si applicable)

**Fichiers à ajouter** :
```
billing/
├── services/
│   ├── stripe-intent.service.ts (NOUVEAU)
│   └── stripe-webhook-handler.service.ts (NOUVEAU)
└── controllers/
    └── stripe-webhooks.controller.ts (NOUVEAU)
```

**Endpoints à ajouter** :
- `POST /api/v1/billing/payment-intents` : Créer PaymentIntent
- `POST /api/v1/webhooks/stripe` : Webhook Stripe (signed)

---

### 3.8 Module: Notifications

**Chemin** : `apps/backend/src/modules/email/` (existant, à étendre)

**Nouvelles responsabilités** :
- Emails transactionnels (Sendgrid)
- Erreurs production
- Statuts commande

**Fichiers à ajouter** :
```
email/
├── services/
│   ├── transactional-email.service.ts (NOUVEAU)
│   └── email-templates.service.ts (NOUVEAU)
└── templates/
    ├── order-confirmation.hbs
    ├── order-shipped.hbs
    ├── production-error.hbs
    └── render-ready.hbs
```

---

### 3.9 Module: Observability

**Chemin** : `apps/backend/src/modules/observability/` (existant)

**Extensions** :
- Sentry integration (déjà présent)
- Structured logs (Winston)
- Correlation IDs (request tracing)

**Fichiers à vérifier/ajouter** :
```
observability/
├── services/
│   └── correlation-id.service.ts (NOUVEAU)
└── interceptors/
    └── logging.interceptor.ts (NOUVEAU)
```

---

### 3.10 Guards & Decorators

**Nouveaux** :
- `@BrandScoped()` : Scoping automatique par brandId
- `@IdempotencyKey()` : Idempotency sur endpoints sensibles
- `@PublicWidget()` : Endpoints widget (API key auth)

**Fichiers** :
```
common/
├── decorators/
│   ├── brand-scoped.decorator.ts (NOUVEAU)
│   ├── idempotency-key.decorator.ts (NOUVEAU)
│   └── public-widget.decorator.ts (NOUVEAU)
├── guards/
│   ├── brand-scoped.guard.ts (NOUVEAU)
│   ├── idempotency.guard.ts (NOUVEAU)
│   └── widget-auth.guard.ts (NOUVEAU)
└── interceptors/
    └── idempotency.interceptor.ts (NOUVEAU)
```

---

## 4. WORKERS BULLMQ

### 4.1 Queues

**Nouvelles queues** :
- `render-preview` : Rendu preview (2D, rapide)
- `render-final` : Rendu final (3D, haute qualité)
- `export-manufacturing` : Export packs (SVG/DXF/PDF/ZIP)
- `asset-convert` : Conversion assets (formats, optimisations)
- `cleanup` : Nettoyage (anciens renders, assets orphelins)

**Queues existantes** (à réutiliser) :
- `ai-generation` : Génération IA
- `render-processing` : Traitement rendus
- `production-processing` : Traitement production

---

### 4.2 Processors

**Fichiers** :
```
jobs/
├── workers/
│   ├── render/
│   │   ├── render-preview.processor.ts (NOUVEAU)
│   │   └── render-final.processor.ts (NOUVEAU)
│   ├── manufacturing/
│   │   ├── export-pack.processor.ts (NOUVEAU)
│   │   └── asset-convert.processor.ts (NOUVEAU)
│   └── cleanup/
│       └── cleanup.processor.ts (NOUVEAU)
```

**Configuration** :
```typescript
// Retry policy
attempts: 3,
backoff: {
  type: 'exponential',
  delay: 2000,
},
removeOnComplete: 100,
removeOnFail: 50,
```

**Idempotency** : Utiliser `specHash` comme job ID

---

### 4.3 Stockage Outputs

**Cloudinary** (existant) :
- Images (preview, thumbnails)
- Formats : PNG, WebP, JPEG

**S3** (à configurer si nécessaire) :
- Packs ZIP (production bundles)
- Modèles 3D (GLTF, USDZ)
- Fichiers DXF/PDF

**URLs signées** : Pour assets privés (production bundles)

---

## 5. WIDGET IMPLEMENTATION

### 5.1 Flow

1. **Load config** : `GET /api/v1/widget/config/:productId`
2. **Edit zones** : Client-side (React/Vue)
3. **Validate live** : `POST /api/v1/personalization/validate` (WebSocket optionnel)
4. **Preview** : `POST /api/v1/renders/preview` → Polling `GET /api/v1/renders/:id/status`
5. **Create snapshot** : `POST /api/v1/snapshots` (idempotent avec specHash)
6. **Add to cart Shopify** : Client-side avec line item properties

### 5.2 Sécurité Widget

**Règles** :
- ✅ **Jamais accepter preview URLs depuis le client** : Toujours générer côté serveur
- ✅ **Validation serveur** : Toutes les validations côté backend
- ✅ **API Key auth** : Widget utilise API Keys (pas JWT)
- ✅ **Rate limiting** : Stricte pour widget endpoints

### 5.3 Fallback 2D

**Si WebGL fail** :
- Détecter support WebGL
- Fallback vers canvas 2D
- Prévisualisation simplifiée

### 5.4 Analytics Events

**Events à tracker** :
- `widget_loaded`
- `validation_failed`
- `preview_requested`
- `preview_ready`
- `snapshot_created`
- `add_to_cart_clicked`

**Intégration** : Via `AnalyticsEvent` model existant

---

## 6. INTÉGRATIONS & OPS

### 6.1 Cloudflare

**Cache/CDN** :
- Assets (images, modèles) : Cache immutable avec hash
- Configs widget : ETag, cache 1h
- Règles : `Cache-Control: public, max-age=31536000, immutable` pour assets hashés

**WAF** :
- Rate limiting par IP
- Protection DDoS
- Allowlist pour webhooks (Shopify, Stripe)

### 6.2 Sécurité

**Signatures** :
- **Shopify** : HMAC SHA256 avec `X-Shopify-Hmac-Sha256` header
- **Stripe** : Signature avec `Stripe-Signature` header

**CORS** :
- Strict : Seulement domaines autorisés (brands)
- Widget : CORS pour domaines Shopify configurés

**Allowlist** :
- IPs Shopify webhooks
- IPs Stripe webhooks

### 6.3 Observabilité

**Sentry** :
- Déjà configuré
- Ajouter context (brandId, userId, specHash)
- Breadcrumbs pour traces

**Structured Logs** :
- Format JSON
- Correlation IDs
- Niveaux : error, warn, info, debug

**Métriques** :
- Durées (p50, p95, p99)
- Taux d'échec
- Throughput

### 6.4 Emails Sendgrid

**Templates** :
- Order confirmation
- Order shipped
- Production error
- Render ready

**Configuration** : Via `EmailModule` existant

### 6.5 Support Crisp

**Intégration** :
- Liens depuis admin/order/snapshot
- User context (brandId, orderId)
- Script Crisp dans frontend

### 6.6 CI/CD GitHub

**Workflow** :
1. Lint (ESLint)
2. Typecheck (TypeScript)
3. Tests (unit + integration)
4. Prisma migrate deploy (staging)
5. Build
6. Deploy (Railway/Vercel)

**Fichier** : `.github/workflows/deploy.yml`

---

## 7. PLAN FILE-BY-FILE

### 7.1 Prisma Schema

**Fichier** : `apps/backend/prisma/schema.prisma`

**Modifications** :
- Ajouter modèles `DesignSpec`, `Snapshot`, `OrderItem`
- Modifier `Order`, `Design`, `Customization`, `RenderResult`
- Ajouter index

**Voir section 2 pour le diff exact.**

---

### 7.2 Migrations Prisma

**Migration 1** : `apps/backend/prisma/migrations/20241201000000_add_design_spec_and_snapshot/migration.sql`

**Migration 2** : `apps/backend/prisma/migrations/20241201000001_add_order_items/migration.sql`

**Migration 3** : `apps/backend/prisma/migrations/20241201000002_add_snapshot_relations/migration.sql`

**Migration 4** : `apps/backend/prisma/migrations/20241201000003_add_indexes/migration.sql`

**Scripts rollback** : `apps/backend/prisma/migrations/rollback/`

---

### 7.3 Backend Modules

**Structure complète** : Voir section 3 pour chaque module.

**Fichiers principaux à créer** :
- `apps/backend/src/modules/personalization/` (nouveau module complet)
- `apps/backend/src/modules/specs/` (nouveau module complet)
- `apps/backend/src/modules/snapshots/` (nouveau module complet)
- `apps/backend/src/modules/manufacturing/` (nouveau module complet)
- Extensions dans modules existants (render, ecommerce, billing, email)

---

### 7.4 Workers

**Fichiers** :
- `apps/backend/src/jobs/workers/render/render-preview.processor.ts`
- `apps/backend/src/jobs/workers/render/render-final.processor.ts`
- `apps/backend/src/jobs/workers/manufacturing/export-pack.processor.ts`
- `apps/backend/src/jobs/workers/manufacturing/asset-convert.processor.ts`
- `apps/backend/src/jobs/workers/cleanup/cleanup.processor.ts`

---

### 7.5 Tests

**Structure** :
```
apps/backend/src/modules/
├── personalization/
│   └── __tests__/
│       ├── personalization.service.spec.ts
│       └── rules-engine.service.spec.ts
├── specs/
│   └── __tests__/
│       ├── specs.service.spec.ts
│       └── spec-canonicalizer.service.spec.ts
└── snapshots/
    └── __tests__/
        └── snapshots.service.spec.ts
```

**E2E** :
- `apps/backend/test/e2e/widget-flow.e2e-spec.ts`
- `apps/backend/test/e2e/shopify-webhook.e2e-spec.ts`
- `apps/backend/test/e2e/stripe-webhook.e2e-spec.ts`

---

### 7.6 Checklists Sécurité

**Checklist par endpoint** :
- [ ] Validation DTO (Zod/class-validator)
- [ ] RBAC (RolesGuard)
- [ ] Brand scoping (BrandScopedGuard)
- [ ] Rate limiting
- [ ] Idempotency (si mutation)
- [ ] Input sanitization
- [ ] Output sanitization
- [ ] Logging (structured)
- [ ] Error handling (Sentry)

---

## 8. ORDRE D'IMPLÉMENTATION

### Phase 1 : Fondations (Semaine 1)
1. ✅ Décisions architecture
2. ✅ Schema Prisma (DesignSpec, Snapshot, OrderItem)
3. ✅ Migrations Prisma
4. ✅ Guards & Decorators (BrandScoped, Idempotency)

### Phase 2 : Modules Core (Semaine 2)
1. ✅ Module Personalization
2. ✅ Module Specs
3. ✅ Module Snapshots
4. ✅ Extension Render

### Phase 3 : Manufacturing & Workers (Semaine 3)
1. ✅ Module Manufacturing
2. ✅ Workers BullMQ (render, export, cleanup)
3. ✅ Stockage outputs (Cloudinary, S3)

### Phase 4 : Intégrations (Semaine 4)
1. ✅ Extension Shopify (webhooks, line items)
2. ✅ Extension Stripe (intents, webhooks)
3. ✅ Extension Email (templates Sendgrid)
4. ✅ Observabilité (Sentry, logs)

### Phase 5 : Widget (Semaine 5)
1. ✅ Widget endpoints
2. ✅ Flow complet
3. ✅ Fallback 2D
4. ✅ Analytics events

### Phase 6 : Tests & Ops (Semaine 6)
1. ✅ Tests unitaires
2. ✅ Tests integration
3. ✅ Tests E2E
4. ✅ CI/CD
5. ✅ Documentation

---

## 9. RISQUES & MITIGATION

### Risques

1. **Migration Order → OrderItem** : Données existantes
   - **Mitigation** : Migration backward compatible, script de migration testé

2. **Performance** : Index manquants
   - **Mitigation** : Index composites ajoutés, monitoring queries lentes

3. **Idempotency** : Duplicate requests
   - **Mitigation** : Idempotency keys, Redis pour tracking

4. **Webhooks** : Signatures invalides
   - **Mitigation** : Tests signatures, logging détaillé

---

## 10. MÉTRIQUES DE SUCCÈS

- ✅ **Performance** : < 200ms pour endpoints widget (p95)
- ✅ **Disponibilité** : > 99.9% uptime
- ✅ **Erreurs** : < 0.1% error rate
- ✅ **Tests** : > 80% coverage
- ✅ **Sécurité** : 0 vulnérabilités critiques

---

**FIN DU PLAN**








