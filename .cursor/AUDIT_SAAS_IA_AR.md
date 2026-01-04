# Audit Architecture SaaS IA & AR

**Date**: 2024-12-19  
**Projet**: Luneo Platform  
**Objectif**: Évaluation de l'état actuel pour intégration architecture SaaS complète de personnalisation produit avec IA et AR

---

## 📊 ÉTAT ACTUEL DU PROJET

### Structure Monorepo Existante

Le projet utilise un monorepo avec:
- **Workspace Manager**: pnpm workspaces
- **Build System**: Turbo
- **Apps principales**:
  - `apps/frontend` - Next.js 15 (Dashboard + Pages publiques)
  - `apps/backend` - NestJS (API principale)
  - `apps/widget` - Widget embeddable
  - `apps/ar-viewer` - Viewer AR standalone
  - `apps/ai-engine` - Service Python FastAPI
  - `apps/worker-ia` - Workers TypeScript pour génération IA

---

## ✅ MODULES EXISTANTS

### Auth (JWT/API Key)
- **Status**: ✅ **Oui - Partiel**
- **Localisation**: `apps/backend/src/modules/auth/`
- **Fonctionnalités**:
  - JWT avec refresh tokens
  - OAuth (Google, GitHub)
  - API Keys avec scopes/permissions
  - Guards NestJS (JwtAuthGuard, ApiKeyGuard)
- **À compléter**:
  - Rate limiting par API Key
  - Domain/IP whitelisting pour API Keys
  - Multi-tenant isolation renforcée

### Users/Clients B2B
- **Status**: ✅ **Oui - Complet**
- **Localisation**: `apps/backend/prisma/schema.prisma`
- **Modèles Prisma**:
  - `User` avec rôles (CONSUMER, BRAND_USER, BRAND_ADMIN, PLATFORM_ADMIN, FABRICATOR)
  - `Brand` (équivalent Client B2B) avec:
    - Stripe integration
    - Subscription plans
    - Budgets AI (aiCostLimitCents, aiCostUsedCents)
    - Settings JSON
    - Webhooks
- **À adapter**:
  - Renommer `Brand` → `Client` pour cohérence avec le prompt
  - Ajouter `ClientSettings` séparé (actuellement dans `Brand.settings` JSON)

### Products avec zones
- **Status**: ✅ **Oui - Complet**
- **Localisation**: `apps/backend/prisma/schema.prisma`
- **Modèles**:
  - `Product` avec `baseAssetUrl`, `model3dUrl`, `customizationOptions`
  - `Zone` avec position 3D, UV mapping, contraintes
  - `CustomizableArea` (Zakeke-like) pour widget editor
- **À compléter**:
  - Ajouter `CustomizationZone` (type du prompt) si différent de `Zone`
  - Templates de prompts par produit

### Generation IA
- **Status**: ✅ **Oui - Partiel**
- **Localisation**:
  - `apps/backend/src/libs/ai/` - Orchestrateur + Providers
  - `apps/worker-ia/` - Workers Bull/BullMQ
  - `apps/ai-engine/` - Service Python FastAPI
- **Providers existants**:
  - OpenAI DALL-E 3 (✅)
  - Replicate SDXL (✅)
  - Stability AI (❌ manquant)
- **Queue**:
  - Bull/BullMQ configuré dans `apps/backend`
  - Workers TypeScript dans `apps/worker-ia`
- **À compléter**:
  - Service Python avec Celery (actuellement FastAPI seul)
  - Provider Stability AI
  - Factory pattern pour providers
  - Prompt builder service

### Queue Bull/BullMQ
- **Status**: ✅ **Oui - Complet**
- **Localisation**: `apps/backend/src/jobs/`
- **Configuration**:
  - BullModule configuré
  - Workers pour design, manufacturing, AI
- **À vérifier**:
  - Queue `generation` spécifique pour le nouveau module

### Widget embeddable
- **Status**: ✅ **Oui - Partiel**
- **Localisation**: `apps/widget/`
- **Structure**:
  - `src/init.ts` - Point d'entrée
  - `src/components/LuneoWidget.tsx` - Composant principal
  - Vite config pour build IIFE/ES/UMD
- **À compléter**:
  - Core Widget class avec EventEmitter
  - APIClient pour communication API
  - Composants manquants (CustomizationForm, ImagePreview, ARButton, etc.)
  - Types TypeScript complets
  - Bundle size optimization (< 200KB gzipped)

### AR Viewer WebXR
- **Status**: ✅ **Oui - Partiel**
- **Localisation**:
  - `apps/ar-viewer/` - App standalone
  - `apps/frontend/src/app/ar/viewer/page.tsx` - Page Next.js
  - `packages/ar-export/src/WebXRViewer.ts` - Classe WebXR
- **Fonctionnalités**:
  - WebXR API implementation
  - Hit test (surface detection)
  - Face/Hand tracking (partiel)
  - Three.js integration
- **À compléter**:
  - Hook `useARSession` React
  - Composant `ARScene` complet
  - Support tracking types (face, body, hand, surface)
  - Controls UI (capture, size toggle, close)

### Service Python IA
- **Status**: ⚠️ **Partiel - À restructurer**
- **Localisation**: `apps/ai-service/` (à créer) ou `apps/ai-engine/`
- **Existant**:
  - `apps/ai-engine/` - FastAPI avec endpoints génération
  - Pas de Celery workers configurés
- **À créer**:
  - Structure `packages/ai-service/` selon prompt
  - Celery workers pour génération async
  - Providers abstraits (OpenAI, Stability, Replicate)
  - Service image generator
  - Storage service (S3)

---

## 🗄️ SCHEMA PRISMA

### Modèles Existants vs Requis

| Modèle Prompt | Modèle Existant | Status | Action |
|---------------|-----------------|--------|--------|
| `User` | `User` | ✅ | Adapter rôles |
| `Client` | `Brand` | ⚠️ | Renommer ou mapper |
| `ClientSettings` | `Brand.settings` (JSON) | ⚠️ | Extraire en modèle séparé |
| `ApiKey` | `ApiKey` | ✅ | Compléter permissions |
| `Product` | `Product` | ✅ | Ajouter champs manquants |
| `CustomizationZone` | `Zone` + `CustomizableArea` | ⚠️ | Unifier ou mapper |
| `Template` | `PromptTemplate` | ⚠️ | Adapter structure |
| `Generation` | `Design` + `AIGeneration` | ⚠️ | Unifier ou créer nouveau |
| `Webhook` | `Webhook` | ✅ | Compléter events |
| `Invoice` | ❌ | ❌ | **À créer** |
| `UsageRecord` | `UsageMetric` | ⚠️ | Adapter |
| `AnalyticsEvent` | `AnalyticsEvent` | ✅ | OK |

### Champs Manquants à Ajouter

**Product**:
- `promptTemplate` (String?)
- `negativePrompt` (String?)
- `aiProvider` (String, default: "openai")
- `generationQuality` (String, default: "standard")
- `outputFormat` (String, default: "png")
- `outputWidth` / `outputHeight` (Int)

**Generation** (nouveau modèle ou adapter `Design`):
- `publicId` (String, unique)
- `sessionId` (String?)
- `finalPrompt` (String)
- `aiProvider`, `model`, `quality`
- `processingTime`, `tokensUsed`, `cost`
- `arModelUrl` (String?)
- `viewedInAr`, `arViewCount`, `downloadCount`

**ClientSettings** (nouveau modèle):
- `primaryColor`, `secondaryColor`
- `fontFamily`, `borderRadius`
- `defaultAiProvider`, `customApiKey`
- `arTrackingType`, `arQuality`

---

## 📁 FICHIERS VOLUMINEUX (>300 lignes)

### Fichiers à Refactorer

1. **`apps/frontend/src/app/(dashboard)/dashboard/configurator-3d/page.tsx`** - **5942 lignes**
   - **Action**: Refactorer en composants modulaires
   - **Découpage suggéré**:
     - `Configurator3DPage.tsx` (< 200 lignes)
     - `components/Configurator3DCanvas.tsx`
     - `components/Configurator3DControls.tsx`
     - `components/Configurator3DToolbar.tsx`
     - `hooks/useConfigurator3D.ts`

2. **`apps/frontend/src/app/(dashboard)/dashboard/ar-studio/integrations/page.tsx`** - **5194 lignes**
   - **Action**: Refactorer
   - **Découpage**: Composants par intégration (Shopify, WooCommerce, etc.)

3. **`apps/frontend/src/app/(dashboard)/dashboard/ai-studio/templates/page.tsx`** - **5144 lignes**
   - **Action**: Refactorer
   - **Découpage**: TemplateList, TemplateEditor, TemplatePreview

4. **`apps/frontend/src/app/(dashboard)/dashboard/ar-studio/collaboration/page.tsx`** - **5061 lignes**
   - **Action**: Refactorer
   - **Découpage**: CollaborationBoard, CommentThread, ShareDialog

5. **`apps/frontend/src/app/(dashboard)/dashboard/library/import/page.tsx`** - **5044 lignes**
   - **Action**: Refactorer
   - **Découpage**: ImportWizard, FileUploader, ImportPreview

6. **`apps/frontend/src/app/(dashboard)/dashboard/analytics-advanced/page.tsx`** - **5042 lignes**
   - **Action**: Refactorer
   - **Découpage**: AnalyticsDashboard, ChartComponents, Filters

7. **`apps/frontend/src/app/(dashboard)/dashboard/billing/page.tsx`** - **5023 lignes**
   - **Action**: Refactorer
   - **Découpage**: BillingOverview, InvoiceList, PaymentMethods

8. **`apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx`** - **5016 lignes**
   - **Action**: Refactorer
   - **Découpage**: ProductList, ProductCard, ProductFilters

**Total**: 8 fichiers > 5000 lignes, 19 fichiers > 3000 lignes

---

## 🗑️ CODE À SUPPRIMER (doublons/inutile)

### Fichiers Potentiellement Obsolètes

1. **`apps/modules-backup/`** - 42 fichiers TypeScript
   - **Raison**: Backup, probablement obsolète
   - **Action**: Vérifier puis supprimer si non utilisé

2. **Scripts de fix JSX** (racine):
   - `fix-all-jsx-final.js`
   - `fix-all-misplaced-tags.js`
   - `fix-jsx-final.js`
   - `fix-jsx-tags.js`
   - `fix-jsx-ultimate.js`
   - **Raison**: Scripts de correction ponctuels, à archiver
   - **Action**: Déplacer dans `scripts/archive/` ou supprimer

3. **Fichiers de documentation temporaires** (racine):
   - Multiples fichiers `*_STATUS.md`, `*_COMPLETE.md`
   - **Action**: Consolider dans `docs/` ou supprimer

---

## 🔍 CODE EXISTANT PERTINENT

### Génération IA

**Backend NestJS**:
- `apps/backend/src/libs/ai/ai-orchestrator.service.ts` - Orchestrateur avec routing
- `apps/backend/src/libs/ai/providers/openai.provider.ts` - Provider OpenAI
- `apps/backend/src/libs/ai/providers/replicate-sdxl.provider.ts` - Provider Replicate
- `apps/backend/src/jobs/workers/design/design.worker.ts` - Worker Bull

**Service Python**:
- `apps/ai-engine/routers/generate.py` - Endpoint FastAPI
- `apps/ai-engine/services/texture_generator.py` - Génération texture

**Frontend**:
- `apps/frontend/src/app/api/ai/generate/route.ts` - API Route Next.js

### Widget

**Structure existante**:
- `apps/widget/src/init.ts` - Point d'entrée (98 lignes)
- `apps/widget/src/components/LuneoWidget.tsx` - Composant principal
- `apps/widget/vite.config.ts` - Configuration build

**Intégrations**:
- `woocommerce-plugin/js/luneo-widget.js` - Plugin WooCommerce
- `apps/frontend/src/app/(public)/w/[brandId]/[productId]/page.tsx` - Page widget publique

### AR Viewer

**WebXR Implementation**:
- `packages/ar-export/src/WebXRViewer.ts` - Classe WebXR complète
- `apps/frontend/src/app/ar/viewer/page.tsx` - Page AR viewer (388 lignes)
- `apps/frontend/src/components/ar/ARViewer.tsx` - Composant AR
- `apps/frontend/src/components/ar/ViewInAR.tsx` - Button AR

**AR Engine**:
- `packages/ar-engine/src/core/ARScene.ts` - Scene AR

---

## 🎯 DÉCISION GLOBALE

### ✅ **INTÉGRATION - Ajouter aux modules existants**

**Justification**:
1. **Architecture solide existante**: Le projet a déjà une base solide avec:
   - NestJS backend bien structuré
   - Prisma schema complet
   - Widget embeddable en cours
   - AR viewer partiellement implémenté
   - Service Python FastAPI

2. **Modules récupérables**:
   - ✅ Auth (JWT + API Key) - À compléter
   - ✅ Products & Zones - À adapter
   - ✅ Generation IA - À restructurer
   - ✅ Queue Bull - OK
   - ⚠️ Widget - À compléter selon prompt
   - ⚠️ AR Viewer - À compléter selon prompt
   - ⚠️ Service Python - À restructurer avec Celery

3. **Actions principales**:
   - **Adapter** le schema Prisma (ajouter champs manquants)
   - **Compléter** les modules existants plutôt que réécrire
   - **Refactorer** les fichiers volumineux en parallèle
   - **Créer** les modules manquants (Invoice, ClientSettings séparé)

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### Phase 0: Audit ✅ (EN COURS)
- [x] Analyse structure projet
- [x] Identification modules existants
- [x] Détection fichiers volumineux
- [x] Rapport d'audit

### Phase 1: Schema Prisma
- [ ] Adapter `Brand` → `Client` (ou mapper)
- [ ] Créer `ClientSettings` modèle séparé
- [ ] Ajouter champs manquants à `Product`
- [ ] Créer/Adapter `Generation` modèle
- [ ] Créer `Invoice` modèle
- [ ] Migration Prisma

### Phase 2: Backend NestJS
- [ ] Module `Generation` complet (controller, service, processor)
- [ ] Service `PromptBuilder`
- [ ] Service `ImageProcessor`
- [ ] Factory `AIProviderFactory`
- [ ] Provider `StabilityProvider`
- [ ] Queue `generation` Bull

### Phase 3: Service IA Python
- [ ] Restructurer `apps/ai-engine` → `packages/ai-service`
- [ ] Configurer Celery workers
- [ ] Providers abstraits (OpenAI, Stability, Replicate)
- [ ] Service `ImageGeneratorService`
- [ ] Service `StorageService` (S3)

### Phase 4: Widget Embeddable
- [ ] Core `Widget` class avec EventEmitter
- [ ] `APIClient` pour communication
- [ ] Composants manquants (CustomizationForm, ImagePreview, etc.)
- [ ] Types TypeScript complets
- [ ] Optimisation bundle size

### Phase 5: AR Viewer
- [ ] Hook `useARSession`
- [ ] Composant `ARScene` complet
- [ ] Composant `Controls` AR
- [ ] Support tous tracking types

### Phase 6: Dashboard Next.js
- [ ] Pages admin (clients, billing, analytics)
- [ ] Pages client B2B (products, customizations, templates, api-keys)
- [ ] Intégration avec nouveaux modules

### Phase 7: Infrastructure
- [ ] Docker Compose production
- [ ] Kubernetes deployments
- [ ] Nginx configuration
- [ ] Health checks

---

## ⚠️ RISQUES IDENTIFIÉS

1. **Fichiers volumineux**: 19 fichiers > 3000 lignes
   - **Impact**: Maintenance difficile, erreurs TypeScript
   - **Mitigation**: Refactoring progressif en parallèle

2. **Schema Prisma complexe**: 2340+ lignes
   - **Impact**: Migrations risquées
   - **Mitigation**: Migrations incrémentales, backups

3. **Duplication code**: Modules similaires dans différents apps
   - **Impact**: Incohérences, bugs
   - **Mitigation**: Unifier dans packages partagés

4. **Service Python non structuré**: Pas de Celery configuré
   - **Impact**: Pas de génération async scalable
   - **Mitigation**: Restructurer selon prompt

---

## ✅ PROCHAINES ÉTAPES IMMÉDIATES

1. **Valider ce rapport** avec l'équipe
2. **Décider** sur `Brand` vs `Client` (renommer ou mapper)
3. **Créer** les todos pour Phase 1 (Schema Prisma)
4. **Commencer** Phase 1 avec migration Prisma incrémentale

---

**Rapport généré le**: 2024-12-19  
**Par**: Agent Cursor - Phase 0 Audit


