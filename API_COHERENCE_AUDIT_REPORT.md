# Rapport d'audit de cohérence API Backend (NestJS) / Frontend (Next.js) – Luneo

**Date:** 21 février 2025  
**Objectif:** Vérifier que toutes les routes API du backend ont un mapping correct dans le client frontend, et inversement (méthodes HTTP, URLs, paramètres, DTOs).

---

## 1. Périmètre analysé

- **Client REST:** `apps/frontend/src/lib/api/client.ts` (objet `endpoints` + `api`)
- **Routers tRPC:** `apps/frontend/src/lib/trpc/routers/*.ts` (appels à `api.get/post/...` et `endpoints.*`)
- **Backend:** `apps/backend/src/modules/*/` (controllers NestJS)
- **Préfixe global backend:** `/api/v1` (défini dans `main.ts` via `app.setGlobalPrefix(apiPrefix)`)

---

## 2. Synthèse

| Catégorie | Statut |
|-----------|--------|
| Préfixe `/api/v1` | ✅ Cohérent partout (client et backend) |
| Auth (login, signup, me, refresh, 2FA, etc.) | ✅ Aligné |
| Billing, plans, credits, orders, users, team, security | ✅ Aligné |
| Designs (list, get, create, delete, versions) | ✅ Aligné (designs.controller + tRPC design router) |
| Public API (api-keys, webhooks) | ✅ Aligné (retry = webhook log ID côté backend) |
| **Visual Customizer** | ❌ **Incohérences identifiées et corrigées** (voir § 4) |
| Token sur routes protégées | ✅ `withCredentials: true` + intercepteur refresh 401 |

---

## 3. Détail des vérifications

### 3.1 Client `client.ts` vs Backend

- **Auth:** `endpoints.auth.*` → `/api/v1/auth/*` → `AuthController('auth')` ✅  
- **Users:** `endpoints.users.*` → `/api/v1/users/*` → `UsersController('users')` ✅  
- **Settings:** `endpoints.settings.*` → `/api/v1/settings/*` → `SettingsController('settings')` ✅  
- **Brands:** `endpoints.brands.*` → `/api/v1/brands/*` → `BrandsController('brands')` ✅  
- **Products:** `endpoints.products.*` → `/api/v1/products/*` → `ProductsController('products')` ✅  
- **Projects:** `endpoints.projects.*` → `/api/v1/projects/*` → `ProjectsController('projects')` ✅  
- **Designs:** `endpoints.designs.*` → `/api/v1/designs/*` → `DesignsController('designs')` ✅  
- **AI:** `endpoints.ai.*` → `/api/v1/ai/*` et `/api/v1/generation/*` ✅  
- **Orders:** `endpoints.orders.*` → `/api/v1/orders/*` ✅  
- **Analytics:** `endpoints.analytics.*` → `/api/v1/analytics/*` ✅  
- **Credits:** `endpoints.credits.*` → `/api/v1/credits/*` ✅  
- **Billing / Plans:** `endpoints.billing.*` → `/api/v1/billing/*`, `/api/v1/plans/*` ✅  
- **Notifications:** `endpoints.notifications.*` → `/api/v1/notifications/*` ✅  
- **Security / GDPR:** `endpoints.security.*` → `/api/v1/security/*`, `/api/v1/users/me/sessions` ✅  
- **Integrations:** `endpoints.integrations.*` → `/api/v1/integrations/*`, `/api/v1/ecommerce/analytics` ✅  
- **Team:** `endpoints.team.*` → `/api/v1/team/*` ✅  
- **Public API / Webhooks:** `endpoints.publicApi.*`, `endpoints.webhooks.*` → `/api/v1/api-keys/*`, `/api/v1/public-api/webhooks/*` ✅  
- **Try-On, Experiments, Marketplace, Admin, Orion, Agents, AR:** URLs et méthodes cohérentes avec les controllers backend.

### 3.2 Routers tRPC

- **design.ts:** utilise `endpoints.designs.get` et `api.get('/api/v1/designs/:id/versions')` → backend `DesignsController` expose `GET designs/:id/versions` ✅  
- **order.ts:** utilise `endpoints.orders.*` et `api.post/put` sur `/api/v1/orders/*` ✅  
- **team.ts:** utilise `endpoints.team.*` uniquement ✅  
- **customizer.ts, customizer-zones.ts, customizer-sessions.ts, customizer-export.ts:** voir § 4 (corrections appliquées).  
- **customization.ts:** `api` vers `/api/v1/product-engine/...`, `/api/v1/customization/*` → backend `ProductEngineController`, `CustomizationController` ✅  
- **analytics-advanced.ts, ab-testing.ts, ar.ts, library.ts:** appels `api.get/post` vers `/api/v1/analytics/advanced/*`, `/api/v1/orion/experiments/*`, `/api/v1/ar-studio/*`, `/api/v1/marketplace/*` → routes backend présentes ou gérées en erreur (catch).  
- **billing.ts:** utilise `billingService` (qui s’appuie sur REST) → pas de divergence directe avec le client.

### 3.3 Appels directs (hors client central)

- **CustomizerForm.tsx:** utilise déjà `/api/v1/visual-customizer/customizers/${customizerId}` et `.../customizers` pour GET/PUT/POST ✅  
- **SessionsTable.tsx:** utilisait `/api/v1/visual-customizer/customizers/:id/analytics/sessions` alors que le backend expose `GET /api/v1/visual-customizer/analytics/sessions?customizerId=...` → corrigé (§ 4).  
- **BillingService.ts, ReportService.ts, useCollections.ts, useLibrary.ts, etc.:** URLs `/api/v1/...` conformes aux controllers (billing, reports, collections, library/favorites, marketplace).

---

## 4. Incohérences identifiées et corrections appliquées

### 4.1 Visual Customizer – CRUD customizer (tRPC `customizer.ts`)

**Problème:**  
Le frontend utilisait `/api/v1/visual-customizer/:id` (get, put, delete), `POST /api/v1/visual-customizer`, et `.../:id/publish`, `.../:id/clone`, `.../:id/embed-code`.  
Le backend expose tout sous le segment `customizers` et la route embed est `embed` (pas `embed-code`):

- `VisualCustomizerController('visual-customizer')`:  
  - `GET customizers/:id`, `POST customizers`, `PUT customizers/:id`, `DELETE customizers/:id`  
  - `POST customizers/:id/publish`, `POST customizers/:id/clone`, `GET customizers/:id/embed`

**Correction:**  
Dans `apps/frontend/src/lib/trpc/routers/customizer.ts`, toutes les URLs ont été alignées sur le backend :

- Liste: `GET /api/v1/visual-customizer/customizers`  
- Get one: `GET /api/v1/visual-customizer/customizers/:id`  
- Create: `POST /api/v1/visual-customizer/customizers`  
- Update: `PUT /api/v1/visual-customizer/customizers/:id`  
- Delete: `DELETE /api/v1/visual-customizer/customizers/:id`  
- Publish: `POST /api/v1/visual-customizer/customizers/:id/publish`  
- Clone: `POST /api/v1/visual-customizer/customizers/:id/clone`  
- Embed: `GET /api/v1/visual-customizer/customizers/:id/embed` (remplacement de `embed-code`)

---

### 4.2 Visual Customizer – Zones (tRPC `customizer-zones.ts`)

**Problème:**  
Le frontend utilisait `/api/v1/visual-customizer/:customizerId/zones`.  
Le backend expose `CustomizerZonesController('visual-customizer/customizers/:customizerId/zones')`, donc l’URL complète est `/api/v1/visual-customizer/customizers/:customizerId/zones`.

**Correction:**  
Dans `apps/frontend/src/lib/trpc/routers/customizer-zones.ts`, toutes les URLs zones ont été préfixées par `customizers` :

- `/api/v1/visual-customizer/customizers/:customizerId/zones` (list, create, reorder)  
- `/api/v1/visual-customizer/customizers/:customizerId/zones/:id` (get, update, delete)

---

### 4.3 Visual Customizer – Export (tRPC `customizer-export.ts`)

**Problème:**  
Le frontend appelait :

- `POST /api/v1/visual-customizer/sessions/:sessionId/export/image`  
- `POST /api/v1/visual-customizer/sessions/:sessionId/export/pdf`  
- `POST /api/v1/visual-customizer/sessions/:sessionId/export/print`  

Le backend expose `CustomizerExportController('visual-customizer/export')` avec :

- `POST visual-customizer/export/image`  
- `POST visual-customizer/export/pdf`  
- `POST visual-customizer/export/print`  

et attend `sessionId` (et options) **dans le body**, pas dans l’URL.

**Correction:**  
Dans `apps/frontend/src/lib/trpc/routers/customizer-export.ts` :

- Les appels ont été changés en `POST /api/v1/visual-customizer/export/image`, `.../export/pdf`, `.../export/print`.  
- Le body inclut systématiquement `sessionId` (+ options format, width, height, etc. pour image) conforme aux DTOs backend (`ExportImageDto`, `ExportPrintDto`).  
- La récupération du statut de job reste `GET /api/v1/visual-customizer/export/jobs/:jobId` (déjà correct).

---

### 4.4 Visual Customizer – Analytics sessions (SessionsTable.tsx)

**Problème:**  
Le frontend appelait `GET /api/v1/visual-customizer/customizers/${customizerId}/analytics/sessions` avec des query params.  
Le backend expose `CustomizerAnalyticsController('visual-customizer/analytics')` avec `GET analytics/sessions` et attend `customizerId`, `from`, `to` (et optionnellement d’autres) en **query**.

**Correction:**  
Dans `apps/frontend/src/components/Customizer/analytics/SessionsTable.tsx`, l’URL a été remplacée par :

- `GET /api/v1/visual-customizer/analytics/sessions`  
avec `params: { customizerId, from, to, sort, order, page, pageSize, search }` (selon ce que le backend accepte).

---

## 5. Points déjà conformes (à conserver)

- **Auth:** utilisation de `authFetch` avec URLs relatives pour le proxy Next.js et les cookies httpOnly.  
- **CSRF:** envoi de `X-CSRF-Token` pour POST/PUT/PATCH/DELETE.  
- **Refresh token:** intercepteur axios sur 401 (hors endpoints auth) avec retry.  
- **X-Brand-Id:** envoyé quand `brandId` est en localStorage.  
- **Webhooks retry:** le client envoie le `logId` en paramètre d’URL ; le backend `Post(':id/retry')` attend l’ID du log → sémantique alignée.

---

## 6. Recommandations

1. **Centraliser les appels REST** dans `client.ts` ou `endpoints` pour les nouvelles fonctionnalités, et faire appel à ces méthodes depuis les routers tRPC ou les composants, afin d’éviter des URLs en dur divergentes.  
2. **Documenter les DTOs** (backend) et les types (frontend) pour les payloads d’export (image, pdf, print) pour garder format/quality/options alignés.  
3. **Tests E2E ou d’intégration** sur les flux Visual Customizer (zones, export, analytics) pour valider les corrections.  
4. **Vérifier** les routes appelées en `fetch()` direct (ex. onboarding, chat, admin proxy) pour s’assurer qu’elles existent bien sous `/api/v1` avec les bons contrôleurs.

---

## 7. Fichiers modifiés

- `apps/frontend/src/lib/trpc/routers/customizer.ts` – URLs customizers + embed  
- `apps/frontend/src/lib/trpc/routers/customizer-zones.ts` – URLs zones avec segment customizers  
- `apps/frontend/src/lib/trpc/routers/customizer-export.ts` – URLs export + body avec sessionId  
- `apps/frontend/src/components/Customizer/analytics/SessionsTable.tsx` – URL analytics/sessions + query params  

---

*Rapport généré dans le cadre de l’audit de cohérence API Luneo (backend NestJS / frontend Next.js).*
