# Architecture complete du projet (etat actuel)

## 1. Portee et principe

Ce document decrit l'architecture technique complete du projet `luneo-platform` telle qu'elle est actuellement dans le code.

Objectifs:
- donner une vision unique Frontend + Backend + packages + infra;
- faciliter l'onboarding des nouveaux projets;
- expliciter les frontieres de responsabilite et les flux critiques;
- pointer les ecarts connus entre architecture cible et architecture reellement presente.

## 2. Vue d'ensemble du monorepo

Le repository est un monorepo `pnpm` orchestre par `turborepo`.

- Orchestration: `pnpm-workspace.yaml`, `turbo.json`, `package.json` racine.
- Applications actives dans le workspace:
  - `apps/frontend` (Next.js 15, App Router)
  - `apps/backend` (NestJS)
- Packages partages:
  - `packages/types`
  - `packages/ai-safety`
  - `packages/ui`
  - `packages/billing-plans`
- CI/CD: workflows GitHub Actions dans `.github/workflows`.
- Deploiement:
  - Frontend: Vercel (`vercel.json`)
  - Backend: Railway/Docker (`railway.json`, `Dockerfile`)

Note importante:
- `apps/ai-engine` n'est pas present dans ce repository a l'etat actuel.

## 3. Structure physique (haut niveau)

```text
luneo-platform/
├── apps/
│   ├── backend/
│   └── frontend/
├── packages/
│   ├── ai-safety/
│   ├── billing-plans/
│   ├── types/
│   └── ui/
├── docs/
├── scripts/
├── .github/workflows/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 4. Backend - architecture complete (`apps/backend`)

### 4.1 Stack et role

- Framework: NestJS (API principale et logique metier).
- ORM et DB: Prisma + PostgreSQL.
- Cache / async / coordination: Redis + Bull/BullMQ.
- Integrations externes: Stripe, providers email, OAuth, providers LLM, Cloudinary (selon modules).
- Securite transverse: JWT, RBAC, CSRF, rate limiting, headers de securite.

### 4.2 Points d'entree

- `src/main.ts`: bootstrap principal.
- `src/app.module.ts`: composition des modules et providers globaux.
- `src/serverless.ts`: bootstrap adapte a l'execution serverless.

### 4.3 Organisation interne

- `src/modules/`: domaines metier.
- `src/common/`: guards, interceptors, filters, middlewares, decorators.
- `src/libs/`: services techniques mutualises (prisma, redis, queues, idempotency, llm, vector, storage, etc.).
- `src/config/`: configuration, validation env, logging.
- `prisma/`: schema, migrations, seed.
- `scripts/`: operations de migration/maintenance/readiness.
- `test/`: suites e2e, integration, security, performance, chaos.

### 4.4 Domaines metier backend

#### Identite, securite, gouvernance
- `auth`, `users`, `security`, `rbac`, `settings`, `audit`, `admin`, `organizations`.
- Responsabilites:
  - authentification (signup/login/refresh/logout);
  - gestion session/token et 2FA/OAuth;
  - permissions et controle d'acces;
  - audit et administration.

#### Monnetisation et limites
- `billing`, `pricing`, `credits`, `usage-billing`, `quotas`, `referral`.
- Responsabilites:
  - plans et abonnement;
  - checkout / webhooks Stripe;
  - metering d'usage;
  - enforcement des quotas et overage.

#### Runtime IA conversationnel
- `agents`, `agent-templates`, `orchestrator`, `conversations`, `memory`, `actions`, `automation`.
- `rag`, `knowledge`, `llm`, `widget-api`, `channels`.
- Responsabilites:
  - orchestration d'une requete conversationnelle;
  - enrichissement contexte (RAG/knowledge);
  - appel provider LLM;
  - persistence conversation + usage tracking;
  - exposition via widget et canaux.

#### Integrations et support operationnel
- `email`, `integrations-api`, `contacts/contact`, `health`, `analytics-clean`, `notifications` (maturite variable selon module).

### 4.5 Couche technique transversale

- Validation et serialisation:
  - DTO + validation globale via `ValidationPipe` (whitelist/transform).
- Securite:
  - guards globaux (JWT/roles/rate-limit/CSRF/scopes selon configuration);
  - gestion CORS/headers/cookies;
  - routes webhook avec raw body pour verification de signatures.
- Observabilite:
  - logs structures;
  - Sentry/instrumentation selon environnement.
- Fiabilite:
  - idempotence pour traitements sensibles (notamment webhooks paiement);
  - queues pour traitement asynchrone (email/escalations/autres jobs).

### 4.6 Donnees

- Prisma schema central dans `prisma/schema.prisma`.
- Migrations SQL versionnees dans `prisma/migrations`.
- Seed dans `prisma/seed.ts`.
- Services d'acces DB/caches dans `src/libs/*`.

## 5. Frontend - architecture complete (`apps/frontend`)

### 5.1 Stack et role

- Framework: Next.js 15 (App Router).
- UI: React 18 + Tailwind + systeme de composants.
- Data fetching: React Query.
- Etat local/global cible: hooks + Zustand (domaines cibles).
- API access: client central + API routes Next (proxy/facade selon besoins).

### 5.2 Points d'entree frontend

- `src/app/layout.tsx`: layout racine.
- `src/app/providers.tsx`: montage providers globaux.
- `middleware.ts`: securite edge, routage protege, policies.

### 5.3 Organisation interne

- `src/app/`:
  - route groups `(public)`, `(auth)`, `(dashboard)`, `(super-admin)`, `(onboarding)`;
  - pages, layouts, boundaries d'erreur;
  - API routes Next dans `src/app/api/**`.
- `src/components/`: UI et composants metier.
- `src/lib/`: API client, auth/session, securite, erreurs, analytics, helpers.
- `src/hooks/` + `src/lib/hooks/`: hooks metier/transverses.
- `src/store/`: Zustand stores.
- `src/i18n/`: internationalisation.
- `src/styles/`: styles globaux et tokens.

### 5.4 Domaines fonctionnels frontend

#### Public et marketing
- Pages publiques, pricing, docs/help, legal, contenu.

#### Authentification
- Login/register/forgot/reset/verification/callback.
- Utilisation de routes API auth et gestion session cote client.

#### Dashboard produit
- Espaces operationnels: agents, conversations, knowledge, analytics, integrations, billing, settings, support/team, etc.

#### Super-admin
- Espace de supervision et administration avancee.

### 5.5 Data/API/Auth cote frontend

- Client central API: `src/lib/api/client.ts`.
- Strategie:
  - `withCredentials` pour cookies;
  - interceptors (erreurs/retry selon cas);
  - mecanismes CSRF selon routes sensibles.
- Session/auth:
  - helpers session + routes `src/app/api/v1/auth/*`;
  - middleware et guards de layouts pour protection de routes.

### 5.6 Securite et observabilite frontend

- `middleware.ts`:
  - headers de securite (CSP, HSTS, etc. selon env);
  - rate limiting / bot protection (si active);
  - redirections de protection (auth/onboarding).
- Monitoring:
  - Sentry client/server/edge;
  - web-vitals et analytics (selon configuration et consentement).

## 6. Packages partages (`packages/*`)

### 6.1 `@luneo/types`
- Contrats de types partages (notamment widget/AR selon package).

### 6.2 `@luneo/ai-safety`
- Fonctions utilitaires de sanitation/masking/hash de prompts.

### 6.3 `@luneo/ui`
- Composants UI partages + styles + utilities.

### 6.4 `@luneo/billing-plans`
- Definitions de plans, quotas, features et helpers associes.

### 6.5 Point de vigilance

Il existe des zones ou un contrat est duplique entre package partage et implementation locale (ex: billing plans, certains utilitaires). Cela necessite une politique de source unique de verite pour eviter la derive.

## 7. Flux critiques de bout en bout

### 7.1 Flux Auth
1. Utilisateur soumet login/signup via frontend.
2. Front appelle endpoint auth backend (direct ou via route Next).
3. Backend valide credentials, applique policies, cree session/tokens.
4. Session exploitee via cookies + endpoint `me` + guards frontend/backend.

### 7.2 Flux Billing
1. Front initie checkout.
2. Backend cree session Stripe.
3. Stripe envoie webhook signe.
4. Backend verifie signature + idempotence + met a jour plan/statut.
5. Quotas et droits applicatifs sont recalcules.

### 7.3 Flux IA conversationnel
1. Message utilisateur via dashboard/widget.
2. Backend (orchestrator) charge contexte (knowledge/RAG/memory).
3. Appel LLM provider.
4. Reponse persistante + metering usage + enforcement quotas.
5. Reponse renvoyee au client.

## 8. Orchestration build, tests, qualite

### 8.1 Turborepo
- Pipeline definie dans `turbo.json`:
  - `build`, `dev`, `lint`, `test`, `type-check`, `clean`, `deploy`.

### 8.2 Scripts racine
- Commandes globales pour build/lint/test/type-check/smoke/release.
- Objectif: imposer des quality gates avant livraison.

### 8.3 CI/CD
- Workflows GitHub Actions couvrant:
  - CI generale;
  - CI backend;
  - release orchestration;
  - scans de securite;
  - deploiements manuels/assistés selon environnement.

## 9. Deploiement et execution

### 9.1 Frontend
- Cible principale: Vercel.
- Rewrites API definis dans `vercel.json` pour routage vers backend.

### 9.2 Backend
- Cible principale: Railway/Docker.
- Build Docker multi-stage + commande de demarrage dediee.

### 9.3 Environnements
- Local/dev, staging, production avec variables d'environnement dediees.
- Validation stricte des variables critiques cote backend.

## 10. Risques et complexites techniques (etat actuel)

1. Ecart potentiel entre architecture documentee historiquement et code reel actuel (ex: presence/absence de certains services/apps).
2. Surface fonctionnelle tres large (public + dashboard + super-admin + API routes) qui augmente le risque de regression.
3. Duplication possible de certains contrats/utilitaires entre frontend, backend et packages.
4. Maturite heterogene selon modules (certains tres aboutis, d'autres plus partiels).
5. Couplage fort sur flux critiques (auth, billing, ia) qui impose une discipline stricte de tests.

## 11. Principes directeurs pour les prochains gros projets

1. Source unique de verite des contrats (types/DTO/plans).
2. Toute feature doit declarer son domaine owner (backend + frontend).
3. Pas d'ajout d'endpoint sans:
   - contrat request/response explicite,
   - tests minimums (unit/integration ou e2e selon criticite),
   - instrumentation (logs/metrics/alerting).
4. Toute logique IA doit passer par l'orchestrateur et le metering.
5. Toute action sensible (admin/billing/security) doit etre audit loggee.

## 12. Plan d'architecture operationnel (90 jours)

### Phase 1 - Stabilisation (S1-S2)
- valider la cartographie as-is module par module;
- fermer les ecarts de doc;
- figer conventions techniques transverses.

### Phase 2 - Durcissement coeur (S3-S6)
- renforcer auth cookie-first + policies;
- solidifier billing (webhook/idempotence/audit);
- aligner contrats frontend/backend.

### Phase 3 - Industrialisation IA (S7-S10)
- standardiser endpoints IA utilises;
- unifier metering et quotas;
- renforcer tests e2e des parcours critiques IA.

### Phase 4 - Scalabilite organisationnelle (S11-S13)
- ownership map par domaine;
- SLO/runbooks complets;
- governance de release et incident response.

## 13. Fichiers de reference (a connaitre)

### Monorepo
- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`

### Backend
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/serverless.ts`
- `apps/backend/src/config/configuration.ts`
- `apps/backend/prisma/schema.prisma`

### Frontend
- `apps/frontend/src/app/layout.tsx`
- `apps/frontend/src/app/providers.tsx`
- `apps/frontend/middleware.ts`
- `apps/frontend/src/lib/api/client.ts`
- `apps/frontend/src/lib/auth/session-client.ts`

### Packages
- `packages/billing-plans/src/index.ts`
- `packages/types/src/index.ts`
- `packages/ai-safety/src/index.ts`
- `packages/ui/src/index.ts`

---

Document maintenu comme reference architecture as-is.
Derniere mise a jour: 2026-03-01.
