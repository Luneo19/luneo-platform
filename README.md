# 🎨 Luneo Platform - Plateforme 3D/AR SaaS

**Plateforme complète de personnalisation 3D/AR pour e-commerce**

**Last Updated:** November 16, 2025

[![Status](https://img.shields.io/badge/status-production--ready-green)](.)
[![Score](https://img.shields.io/badge/audit-92%25-brightgreen)](.)
[![License](https://img.shields.io/badge/license-proprietary-blue)](.)

---

## 🚀 **Quickstart for Developers**

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+ (or Docker)
- Redis 7+ (or Docker)
- Git

### Quick Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/luneo/platform.git
cd luneo-platform

# 2. Setup development environment
make setup

# 3. Start Docker services (PostgreSQL, Redis, etc.)
make docker-up

# 4. Start development servers
make dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

### Make Commands

```bash
make setup      # Setup dev environment (install deps, generate Prisma client)
make dev        # Start dev servers (frontend + backend)
make build      # Build production bundles
make test       # Run all tests
make docker-up  # Start Docker services (PostgreSQL, Redis)
make docker-down # Stop Docker services
make health     # Check services health
```

### Manual Setup (Alternative)

```bash
# 1. Install dependencies
pnpm install

# 2. Setup database
cd apps/backend
npx prisma generate
npx prisma migrate dev

# 3. Start services
# Terminal 1: Backend
cd apps/backend && npm run start:dev

# Terminal 2: Frontend
cd apps/frontend && npm run dev

# Terminal 3: Worker (optional)
cd apps/worker-ia && npm run dev
```

---

## 📁 **Structure du Projet**

```
luneo-platform/
├── apps/
│   ├── frontend/          # Next.js 15 (490 fichiers)
│   │   ├── src/
│   │   │   ├── app/       # 200+ pages (App Router)
│   │   │   ├── components/ # Composants réutilisables
│   │   │   └── lib/       # Utils, hooks, constants
│   │   └── tests/         # Tests E2E Playwright
│   │
│   ├── backend/           # NestJS API
│   │   ├── src/
│   │   │   └── modules/   # 18 modules (Auth, Billing, AI, etc.)
│   │   └── prisma/        # Database schema
│   │
│   ├── mobile/            # React Native app
│   ├── ar-viewer/         # AR mobile viewer
│   ├── worker-ia/         # AI generation worker
│   ├── widget/            # Widget embeddable
│   └── shopify/           # Shopify app
│
├── scripts/               # Scripts automatisation (41+)
├── docs/                  # Documentation (8 rapports)
└── docker-compose.yml     # Services dev (PostgreSQL, Redis, etc.)
```

---

## ✨ **Features**

### **Frontend**
- ✅ 200+ pages complètes
- ✅ Auth complet (Login, Register, OAuth, Forgot Password)
- ✅ Dashboard interactif
- ✅ 3D Configurator (Three.js)
- ✅ Visual Customizer (Konva.js)
- ✅ Virtual Try-On (MediaPipe)
- ✅ AI Generation (DALL-E)
- ✅ Stripe Integration
- ✅ RGPD compliant

### **Backend**
- ✅ NestJS avec TypeScript
- ✅ Prisma ORM (PostgreSQL)
- ✅ JWT Authentication
- ✅ BullMQ (Job queues)
- ✅ Redis (Cache)
- ✅ S3 (Storage)
- ✅ Stripe (Billing)
- ✅ SendGrid (Emails)
- ✅ Webhooks

---

## 🛠️ **Commandes Disponibles**

### **Make Commands**

```bash
make help          # Voir toutes les commandes
make setup         # Setup complet
make dev           # Lancer dev servers
make build         # Build production
make test          # Tous les tests
make test-e2e      # Tests E2E
make docker-up     # Démarrer services Docker
make docker-down   # Arrêter services Docker
make health        # Health check
make deploy        # Déployer en production
make db-studio     # Ouvrir Prisma Studio (DB GUI)
```

### **npm Scripts (Frontend)**

```bash
npm run dev              # Dev server
npm run build            # Build production
npm run build:analyze    # Analyser bundle size
npm run type-check       # Vérifier types TypeScript
npm run lint             # Linter
npm run test:e2e         # Tests E2E Playwright
npm run test:e2e:ui      # Tests E2E avec UI
```

### **npm Scripts (Backend)**

```bash
npm run start:dev        # Dev server avec watch
npm run build            # Build production
npm run start:prod       # Start production
npm run migrate          # Migrations Prisma
npm run seed             # Seed database
```

### **Monorepo (Turborepo)**

```bash
npm run turbo:lint       # Lint ciblé (frontend, shopify, worker)
npm run turbo:typecheck  # Vérifications de types (frontend, worker, types partagés)
npm run turbo:build      # Builds orchestrés via Turborepo (frontend, backend, shopify, worker, types)
npm run ci               # Pipeline Turborepo complet (lint + type-check + build)
```

> 💡 Installez la CLI si nécessaire : `npm install -g turbo` (ou utilisez `npx turbo`).

---

## 📊 **Status du Projet**

### **Audit Complet** (6 Nov 2025)

| Catégorie | Score | Status |
|-----------|-------|--------|
| Architecture | 100% | ✅ Excellent |
| Sécurité | 95% | ✅ Très bon |
| Performance | 90% | ✅ Très bon |
| Code Quality | 95% | ✅ Excellent |
| Documentation | 100% | ✅ Complète |
| Tests | 60% | 🟡 À améliorer |
| **SCORE GLOBAL** | **92%** | **🏆 Excellent** |

### **Corrections Effectuées**
- ✅ 200+ erreurs corrigées
- ✅ 79 pages 404 créées
- ✅ Bugs critiques (text rendering, dropdowns, auth)
- ✅ Sécurité XSS (3 vulnérabilités)
- ✅ Performance (images, bundle -65%)
- ✅ Stripe refunds, Team invites, GDPR

**Détails:** Voir `🎯_LIRE_EN_PREMIER.md`

---

## 📚 **Documentation**

### **🎯 Pour démarrer:**
1. **`🎯_LIRE_EN_PREMIER.md`** ⭐ Résumé 2 min
2. `README_ACTIONS_IMMEDIATES.md` - Guide 5 min
3. `GUIDE_DEPLOIEMENT_PRODUCTION.md` - Déploiement complet

### **📖 Pour approfondir:**
4. `SYNTHESE_COMPLETE_AUDIT.md` - Vue d'ensemble
5. `RAPPORT_FINAL_ERREURS.md` - 260+ erreurs
6. `CORRECTIONS_EFFECTUEES.md` - Détails corrections
7. `STRIPE_INTEGRATION_CHECKLIST.md` - Config Stripe
8. `API_ROUTES_TEST_PLAN.md` - Tests API

---

## 🔧 **Configuration Requise**

### **Environnement**
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Docker (optionnel)

### **Variables d'environnement**

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG.xxx
# Voir env.example pour la liste complète
```

**Backend** (`.env`):
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=xxx
STRIPE_SECRET_KEY=sk_test_...
REDIS_URL=redis://localhost:6379
# Voir template dans GUIDE_DEPLOIEMENT_PRODUCTION.md
```

---

## 🧪 **Tests**

```bash
# Tests E2E
make test-e2e

# Ou manuel:
cd apps/frontend
npm run test:e2e
npm run test:e2e:ui  # Avec UI Playwright
```

**Tests créés:**
- ✅ `tests/e2e/auth.spec.ts` - Flow authentification
- ✅ `tests/e2e/pricing.spec.ts` - Pricing & checkout
- ✅ `tests/e2e/navigation.spec.ts` - Navigation & dropdowns

---

## 🚀 **Déploiement**

### **Production (Recommandé)**

```bash
# Frontend → Vercel
cd apps/frontend
vercel --prod

# Backend → Railway
cd apps/backend
railway up

# Database → Supabase
# Créer projet sur supabase.com
```

**Guide complet:** `GUIDE_DEPLOIEMENT_PRODUCTION.md`

---

## 🏗️ **Stack Technique**

### **Frontend**
- Next.js 15 (App Router, Server Components)
- React 18
- TypeScript 5.3
- Tailwind CSS 3.4
- Framer Motion
- Konva.js (2D editor)
- Three.js + React Three Fiber (3D)
- MediaPipe (AR Try-On)
- Stripe
- Zod (Validation)

### **Backend**
- NestJS 10
- Prisma 5 (PostgreSQL)
- JWT (Passport)
- BullMQ (Redis)
- Stripe
- AWS S3
- SendGrid
- OpenAI (DALL-E)

---

## 🤝 **Contribution**

### **Développeurs:**

```bash
# 1. Clone
git clone https://github.com/luneo/platform.git

# 2. Setup
make setup

# 3. Créer branche
git checkout -b feature/my-feature

# 4. Développer & tester
make test

# 5. Commit
git commit -m "feat: my feature"

# 6. Push
git push origin feature/my-feature
```

---

## 📞 **Support**

- **Documentation:** `/help/documentation`
- **Email:** support@luneo.app
- **Discord:** discord.gg/luneo (coming soon)

---

## 📜 **License**

Proprietary © 2025 Luneo SAS

---

## 🎉 **Remerciements**

Projet audité et optimisé le 6 Nov 2025
- 260+ erreurs corrigées
- 79 pages créées
- Score qualité: 92/100 🏆

**Status:** ✅ Production-ready

---

**Quick Start:** `make setup && make docker-up && make dev` 🚀
