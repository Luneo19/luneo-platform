# RAPPORT D'AUDIT COMPLET SAAS PRE-PRODUCTION - LUNEO PLATFORM

**Date :** 13 Fevrier 2026
**Auditeur :** IA QA Senior - Audit Production $1B
**Scope :** Frontend (Next.js 15) + Backend (NestJS) + AI Engine (FastAPI) + Packages

---

## TABLE DES MATIERES

1. [Resume Executif](#1-resume-executif)
2. [Phase 0 : Cartographie Architecturale](#2-phase-0--cartographie-architecturale)
3. [Phase 1 : Authentification et Autorisation](#3-phase-1--authentification-et-autorisation)
4. [Phase 2 : Paiements et Abonnements](#4-phase-2--paiements-et-abonnements)
5. [Phase 3 : Quotas et Credits](#5-phase-3--quotas-et-credits)
6. [Phase 4 : Modules Fonctionnels](#6-phase-4--modules-fonctionnels)
7. [Phase 5 : Panel Admin](#7-phase-5--panel-admin)
8. [Phase 6 : Coherence Donnees](#8-phase-6--coherence-donnees)
9. [Phase 7 : Securite et Performance](#9-phase-7--securite-et-performance)
10. [Phase 8 : Checklist Pre-Production](#10-phase-8--checklist-pre-production)
11. [Tableau Recapitulatif des Erreurs](#11-tableau-recapitulatif)
12. [GO / NO-GO Decision](#12-go--no-go)

---

## 1. RESUME EXECUTIF

### Architecture Globale
- **Monorepo Turborepo** : 8 apps, 11 packages
- **Backend** : NestJS 10, 60+ modules, 120+ modeles Prisma, 47+ enums
- **Frontend** : Next.js 15, 409 pages, 264 composants, 147 routes API
- **AI Engine** : Python FastAPI (detect, render, generate)
- **Packages** : billing-plans, virtual-try-on, ar-engine, sdk, ui, etc.

### Synthese des Erreurs

| Severite | Nombre | Domaine Principal |
|----------|--------|-------------------|
| CRITIQUE | 14 | Auth, Billing, Admin, Donnees mockees |
| HIGH | 12 | Securite, Try-On, Quotas, Coherence types |
| MEDIUM | 15 | Performance, UX, Validations |
| LOW | 8 | Code quality, Documentation |
| **TOTAL** | **49** | |

### Verdict : NO-GO (14 erreurs CRITIQUES a corriger)

---

## 2. PHASE 0 : CARTOGRAPHIE ARCHITECTURALE

### 2.1 Structure Confirmee

```
luneo-platform/
+-- apps/
|   +-- backend/          # NestJS API (60+ modules)
|   +-- frontend/         # Next.js 15 (409 pages)
|   +-- ai-engine/        # Python FastAPI
|   +-- worker-ia/        # Worker IA
|   +-- widget/           # Widget embeddable
|   +-- shopify/          # App Shopify
|   +-- mobile/           # App mobile
|   +-- ar-viewer/        # Viewer AR
+-- packages/
|   +-- billing-plans/    # Plans partages
|   +-- virtual-try-on/   # Try-On client
|   +-- ar-engine/        # Moteur AR
|   +-- types/            # Types partages (incomplet)
|   +-- ui/               # Composants UI
|   +-- sdk/              # SDK TypeScript
+-- monitoring/           # Prometheus, alertes
+-- scripts/              # Scripts utilitaires
```

### 2.2 Configuration Serveur (main.ts)

| Composant | Statut | Details |
|-----------|--------|---------|
| Env validation | OK | DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET |
| Env production | OK | STRIPE, SENTRY, CLOUDINARY requis |
| Raw body webhooks | OK | Stripe, WooCommerce, Shopify |
| Cookie parser + CSRF | OK | Middleware global |
| Correlation ID | OK | X-Request-Id sur chaque requete |
| CORS | OK | Origines explicites, pas de wildcard en prod |
| Helmet + compression | OK | Production uniquement pour HPP |
| Rate limiting Express | OK | Production uniquement |
| ValidationPipe | OK | whitelist, forbidNonWhitelisted, transform |
| Graceful shutdown | OK | SIGTERM/SIGINT |
| Health check | OK | /health avant app.init() |
| Swagger | OK | Desactive en production |

### 2.3 Guards Globaux

**CommonModule (Global) :**
- CsrfGuard : Mutations protegees par CSRF
- JwtAuthGuard : Auth JWT globale, skip @Public()
- RolesGuard : RBAC (PLATFORM_ADMIN, BRAND_ADMIN, etc.)
- RateLimitGuard : Rate limiting par endpoint
- BrandScopedGuard : Scoping par brand, anti-IDOR

**AppModule (Global) :**
- SentryGlobalFilter : Error tracking
- LoggingInterceptor : Logging structuree
- CacheableInterceptor : Cache auto
- CacheControlInterceptor : Headers cache
- GlobalRateLimitGuard : Throttler global Redis

### 2.4 Schema Prisma

- ~5700 lignes, 47+ enums, 120+ modeles
- UserRole : CONSUMER, BRAND_USER, BRAND_ADMIN, PLATFORM_ADMIN, FABRICATOR
- SubscriptionPlan : FREE, STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE

---

## 3. PHASE 1 : AUTHENTIFICATION ET AUTORISATION

### ERREURS CRITIQUES

**CRITIQUE #001 - Signup accepte le role client**

| Champ | Valeur |
|-------|--------|
| Fichier | apps/backend/src/modules/auth/auth.service.ts |
| Probleme | SignupDto contient un champ role optionnel. Le service utilise role ou UserRole.CONSUMER. Un client peut envoyer role: PLATFORM_ADMIN et devenir admin. |
| Impact | Escalade de privileges - FAILLE SECURITE MAJEURE |
| Correction | Toujours forcer UserRole.CONSUMER dans signup, ignorer le DTO |

**CRITIQUE #002 - RBAC vs Prisma UserRole mismatch**

| Champ | Valeur |
|-------|--------|
| Fichier | apps/backend/src/modules/security/services/rbac.service.ts |
| Probleme | RBAC utilise Role (SUPER_ADMIN, ADMIN, VIEWER) tandis que Prisma utilise UserRole (PLATFORM_ADMIN, BRAND_ADMIN, CONSUMER). ROLE_PERMISSIONS[user.role] est toujours undefined. userHasPermission() retourne TOUJOURS false. |
| Impact | Systeme de permissions completement casse |
| Correction | Mapper ROLE_PERMISSIONS avec les valeurs UserRole de Prisma |

### ERREURS HIGH

| # | Probleme | Fichier | Impact |
|---|----------|---------|--------|
| 001 | Brute-force fail-open sur erreur Redis | brute-force.service.ts | Lockout bypass si Redis down |
| 002 | 2FA sans rate limiting sur tentatives de code | two-factor.service.ts | Brute-force codes TOTP possible |
| 003 | Refresh token expiration hardcodee (+7j) | token.service.ts | Ignore la config jwt.refreshExpiresIn |

### CE QUI FONCTIONNE BIEN
- Tokens en httpOnly cookies (migration terminee depuis localStorage)
- @Public() utilise uniquement sur les routes auth/OAuth publiques
- 2FA TOTP avec backup codes hashes et detection de reutilisation
- Rotation des refresh tokens (usage unique, famille, revocation automatique)
- Token cleanup cron journalier a 3h du matin
- Routes admin protegees par @Roles(UserRole.PLATFORM_ADMIN)
- Brand-scoped guard empeche les attaques IDOR sur :brandId

---

## 4. PHASE 2 : PAIEMENTS ET ABONNEMENTS

### ERREURS CRITIQUES

**CRITIQUE #003 - Fallback Price IDs hardcodes**

| Champ | Valeur |
|-------|--------|
| Fichier | apps/backend/src/modules/billing/billing.service.ts (lignes 119-132) |
| Probleme | Quand les vars STRIPE_PRICE_* sont absentes, fallback vers price_test_starter_monthly etc. En production = checkout avec prix test |
| Correction | Throw en production si prix non configures |

**CRITIQUE #004 - getPriceIdForPlan('professional') retourne null**

| Champ | Valeur |
|-------|--------|
| Fichier | apps/backend/src/modules/billing/billing.service.ts |
| Probleme | Config keys = priceProMonthly/priceProYearly. Code construit priceProfessionalMonthly. Le plan Professional ne peut pas etre souscrit. |
| Correction | Mapper professional vers les cles Pro existantes |

**CRITIQUE #005 - Downgrade immediat**

| Champ | Valeur |
|-------|--------|
| Fichier | apps/backend/src/modules/billing/billing.service.ts |
| Probleme | Sans immediateChange, le downgrade est quand meme applique immediatement au lieu de fin de periode |
| Correction | Utiliser Stripe Subscription Schedules |

**CRITIQUE #006 - Webhook body property incorrecte**

| Champ | Valeur |
|-------|--------|
| Fichier | apps/backend/src/modules/billing/billing.controller.ts |
| Probleme | Handler utilise req.rawBody mais avec express.raw() le body est dans req.body |
| Correction | Utiliser req.rawBody ?? req.body et verifier Buffer |

### ERREURS HIGH

| # | Probleme | Impact |
|---|----------|--------|
| 004 | Guest checkout userId non en DB | Subscription jamais attachee |
| 005 | Quotas par mois calendaire, pas par periode facturation | Pas de reset au renouvellement |
| 006 | Credits controller instancie Stripe sans StripeClientService | Pas de circuit breaker/retry |

### Plans Definis (source : plan-config.ts)

| Plan | Prix/mois | Designs | Team | Storage | API | Renders 3D |
|------|-----------|---------|------|---------|-----|------------|
| FREE | 0 | 3 | 1 | 0.5 GB | Non | 0 |
| STARTER | 29 | 50 | 3 | 5 GB | Non | 10 |
| PROFESSIONAL | 79 | 500 | 10 | 25 GB | Oui | 100 |
| BUSINESS | 199 | 2000 | 25 | 100 GB | Oui | 500 |
| ENTERPRISE | 499 | Illimite | Illimite | 500 GB | Oui | Illimite |

---

## 5. PHASE 3 : QUOTAS ET CREDITS

### Enforcement Verifie

| Service | Quota | Tracking | Statut |
|---------|-------|----------|--------|
| designs.service.ts | designs_created | trackDesignCreated | OK |
| render-2d.service.ts | renders_2d | trackRender2D | OK |
| render-3d.service.ts | renders_3d | trackRender3D | OK |
| generation.service.ts | ai_generations | trackAIGeneration | OK |
| asset-file.service.ts | storage_gb | - | OK |
| public-api (ApiQuotaGuard) | api_calls | - | OK |
| try-on module | AUCUN | AUCUN | MANQUANT |

### ERREURS HIGH

| # | Probleme | Fichier |
|---|----------|---------|
| 007 | Pas de quota pour Virtual Try-On | try-on/ (tout le module) |
| 008 | Pas de rollback quota sur echec generation AI | generation.processor.ts:164-185 |

---

## 6. PHASE 4 : MODULES FONCTIONNELS

### Tableau Synthetique

| Module | Impl | Quota | Permissions | Mock | Issues |
|--------|------|-------|-------------|------|--------|
| Virtual Try-On | OK | MANQUANT | CRITIQUE (IDOR) | Non | High |
| AI Studio | OK | OK | OK | Non | 1 endpoint manquant |
| Designs | OK | OK | OK | Non | - |
| Products | OK | OK | MEDIUM | Non | findOne sans brand filter |
| Orders | OK | N/A | OK | Non | - |
| Cart | OK | N/A | OK | Non | - |

### CRITIQUE #007 - Try-On IDOR

| Champ | Valeur |
|-------|--------|
| Fichier | try-on.controller.ts (51-156, 174-284) + try-on-configuration.service.ts (73-77, 132-141) |
| Probleme | Endpoints utilisent projectId sans verifier brandId. N'importe quel user peut acceder aux configs d'un autre brand. |
| Correction | Verifier project.brandId === user.brandId dans chaque operation |

### HIGH #009 - Endpoint text-to-design manquant

| Champ | Valeur |
|-------|--------|
| Fichier | apps/frontend/src/app/(dashboard)/ai-studio/page.tsx (ligne 196) |
| Probleme | POST /api/v1/ai/text-to-design appele mais n'existe pas -> 404 |

---

## 7. PHASE 5 : PANEL ADMIN

### Donnees Reelles vs Mockees

| Metrique | Source | Statut |
|----------|--------|--------|
| MRR | Prisma (orders + subscriptions) | REEL |
| Total users/brands | Prisma count | REEL |
| Plan distribution (count) | Prisma groupBy | REEL |
| Recent activity | Prisma orderBy createdAt | REEL |
| LTV | Prisma orders aggregate | REEL |
| planPrice | Hardcode a 0 | CRITIQUE #008 |
| revenueByPlan | = subscribersByPlan (count) | CRITIQUE #009 |
| acquisition (CAC, channels) | Hardcode a 0 | CRITIQUE #010 |
| churnRevenue, NRR | Hardcode a 0 | CRITIQUE #011 |
| Correlations analytics | Math.random() fallback | CRITIQUE #012 |

---

## 8. PHASE 6 : COHERENCE DONNEES

### CRITIQUE #013 - Middleware frontend roles inexistants

| Champ | Valeur |
|-------|--------|
| Fichier | apps/frontend/middleware.ts (ligne 168) |
| Probleme | Check admin autorise PLATFORM_ADMIN, SUPER_ADMIN, ADMIN mais backend n'a que PLATFORM_ADMIN |
| Correction | Limiter a ['PLATFORM_ADMIN'] |

### CRITIQUE #014 - rbac.ts roles differents

| Champ | Valeur |
|-------|--------|
| Fichier | apps/frontend/src/lib/rbac.ts |
| Probleme | Enum Role = USER, ADMIN, SUPER_ADMIN (lowercase). Backend = CONSUMER, PLATFORM_ADMIN (uppercase) |

### Autres incoherences HIGH

| # | Probleme | Impact |
|---|----------|--------|
| 010 | GET /auth/me ne retourne pas isActive, emailVerified, createdAt, updatedAt | Frontend type User incomplet |
| 011 | useProfile attend snake_case, backend envoie camelCase | Donnees profil non affichees |

### Coherence Confirmee
- SubscriptionPlan : aligne (FREE, STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
- API billing responses : format correct
- Error codes : backend utilise AUTH_1001, BIZ_4004 ; frontend classifie par HTTP status

---

## 9. PHASE 7 : SECURITE ET PERFORMANCE

### HIGH #012 - Triple Rate Limiting

| Champ | Valeur |
|-------|--------|
| Fichiers | main.ts + app.module.ts + common.module.ts |
| Probleme | 3 couches simultanees : Express rateLimit+slowDown, ThrottlerModule+GlobalRateLimitGuard, RateLimitGuard dans CommonModule |
| Impact | Meme request comptee 3 fois -> 429 prematures |
| Correction | Garder une seule strategie (recommande : Throttler + GlobalRateLimitGuard) |

### Securite : Points Verifies OK

| Element | Statut | Details |
|---------|--------|---------|
| CSRF | OK | Mutations protegees, webhooks exclus |
| CORS | OK | Pas de wildcard en prod, origines explicites |
| Brand scoping | OK | IDOR prevenu via BrandScopedGuard |
| Bcrypt | OK | 12-13 rounds |
| SQL Injection | OK | Prisma parametree |
| XSS | OK | xss-sanitize middleware |
| Headers | OK | Helmet + CSP nonce + HSTS |
| DLQ controller | CORRIGE | UserRole enum au lieu de string |

### Performance

| Element | Statut |
|---------|--------|
| Indexes DB | OK (composites sur User, Brand, Product, Design, Order) |
| Redis cache | OK (TTLs par type, degradation gracieuse) |
| Cache warming | OK (bootstrap + horaire) |
| Compression | OK (gzip en production) |
| Connection pooling | A documenter (pas de defaults dans code) |

---

## 10. PHASE 8 : CHECKLIST PRE-PRODUCTION

### Variables d'Environnement

| Variable | Requise Prod | Statut |
|----------|-------------|--------|
| DATABASE_URL | OUI | Verifie |
| JWT_SECRET (32+) | OUI | Verifie |
| JWT_REFRESH_SECRET (32+) | OUI | Verifie |
| STRIPE_SECRET_KEY | OUI | Verifie |
| STRIPE_WEBHOOK_SECRET | OUI | Verifie |
| STRIPE_PRICE_*_MONTHLY/YEARLY (8) | OUI | A CONFIGURER |
| ENCRYPTION_KEY (64 hex) | OUI | Verifie |
| SENTRY_DSN | OUI | Verifie |
| CLOUDINARY_* (3) | OUI | Verifie |
| CORS_ORIGINS | OUI | Verifie |
| FRONTEND_URL | OUI | Verifie |
| Email provider | OUI | Au moins un requis |

### Tests Manuels

**Parcours User :** Inscription -> Email -> Login -> Dashboard FREE -> Quota -> Upgrade Stripe -> Features -> Quota mis a jour -> Limite -> Modal upgrade -> Downgrade -> Annulation -> Logout

**Parcours Brand :** Inscription -> Produits -> Try-On -> Analytics -> Equipe

**Parcours Admin :** Login admin -> Dashboard (verifier donnees reelles) -> Recherche user -> Detail -> Modifier subscription -> Refund -> Audit logs

### Monitoring

| Element | Statut |
|---------|--------|
| Sentry | OK |
| Health check | OK |
| Observability | OK |
| Logging Winston | OK |

---

## 11. TABLEAU RECAPITULATIF

### CRITIQUES (14)

| # | Domaine | Description |
|---|---------|-------------|
| 001 | Auth | Signup accepte role client (escalade admin) |
| 002 | Auth | RBAC vs UserRole mismatch (permissions cassees) |
| 003 | Billing | Fallback price IDs hardcodes |
| 004 | Billing | getPriceIdForPlan('professional') retourne null |
| 005 | Billing | Downgrade immediat au lieu de fin de periode |
| 006 | Billing | Webhook body property incorrecte |
| 007 | Try-On | Pas de verification brandId (IDOR) |
| 008 | Admin | planPrice toujours 0 |
| 009 | Admin | revenueByPlan = nombre abonnes |
| 010 | Admin | Acquisition metrics a 0 |
| 011 | Admin | churnRevenue et NRR a 0 |
| 012 | Admin | Correlation API = Math.random() |
| 013 | Types | Middleware frontend : roles inexistants |
| 014 | Types | rbac.ts roles differents du backend |

### HIGH (12)

| # | Description |
|---|-------------|
| 001 | Brute-force fail-open sur erreur Redis |
| 002 | 2FA sans rate limiting sur tentatives |
| 003 | Refresh token expiration hardcodee |
| 004 | Guest checkout userId non en DB |
| 005 | Quotas par mois calendaire |
| 006 | Credits controller sans StripeClientService |
| 007 | Pas de quota pour Virtual Try-On |
| 008 | Pas de rollback quota sur echec generation |
| 009 | Endpoint text-to-design manquant (404) |
| 010 | GET /auth/me champs manquants |
| 011 | useProfile snake_case vs camelCase |
| 012 | Triple rate limiting (429 prematures) |

### MEDIUM (15)

| # | Description |
|---|-------------|
| 001 | Products findOne sans filtre brand |
| 002 | Webhooks pas exemptes du rate limit Express |
| 003 | Password sans complexite |
| 004 | Secrets logues en dev |
| 005 | create-checkout-session @Public() sans CAPTCHA |
| 006 | Success/cancel URLs hardcodees |
| 007 | Refunds seulement Orders |
| 008 | Frontend plans dupliques |
| 009 | No quota = illimite (999999) |
| 010 | Stripe client non-prod skip validation |
| 011 | Credits buy fallback packs |
| 012 | Dashboard vues/downloads = 0 |
| 013 | Dashboard topDesigns views = 0 |
| 014 | Try-On screenshots pas au backend |
| 015 | Try-On pas de session serveur |

---

## 12. GO / NO-GO

### DECISION : NO-GO

14 erreurs CRITIQUES doivent etre corrigees avant mise en production.

### Priorite de correction

**P0 - Bloquants securite (2-3 jours)**
1. CRITIQUE #001 - Signup role escalation
2. CRITIQUE #002 - RBAC permissions cassees
3. CRITIQUE #007 - Try-On IDOR
4. CRITIQUE #013-014 - Roles frontend

**P1 - Bloquants billing (3-4 jours)**
5. CRITIQUE #003 - Fallback price IDs
6. CRITIQUE #004 - Professional plan
7. CRITIQUE #005 - Downgrade immediat
8. CRITIQUE #006 - Webhook body

**P2 - Bloquants donnees admin (5-7 jours)**
9. CRITIQUE #008-012 - Metriques admin

**P3 - High priority (5-7 jours)**
10. Tous les HIGH #001-012

**Total estime : 15-21 jours de developpement**

Apres corrections, relancer l'audit complet pour verification avant GO definitif.

---

*Rapport genere par l'audit SaaS Pre-Production*
*Luneo Platform - 13 Fevrier 2026*
