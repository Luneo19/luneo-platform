# 📚 Documentation - Luneo Platform

**Index complet de la documentation**

---

## 🎯 Guides Essentiels

### Pour Commencer
1. **[SETUP.md](../SETUP.md)** - Guide d'installation et configuration
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture du projet
3. **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Guide de contribution (si présent)
4. **[ONBOARDING.md](./ONBOARDING.md)** - Developer onboarding (prerequisites, setup, commands, workflow)

### Développement
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Guide de développement complet
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Guide de troubleshooting

---

## 🚨 Operational (Runbooks & Recovery)

### Incidents — Runbooks
- **[runbooks/](./runbooks/)** - Réponse aux incidents
  - **[database-down.md](./runbooks/database-down.md)** - P1 : Base de données indisponible
  - **[redis-down.md](./runbooks/redis-down.md)** - P2 : Redis indisponible
  - **[stripe-down.md](./runbooks/stripe-down.md)** - P2 : Paiements / Stripe en échec
  - **[deploy-failed.md](./runbooks/deploy-failed.md)** - P1 : Déploiement échoué

### Recovery & DR
- **[DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)** - Plan de reprise (RPO 6h, RTO 30 min), procédures de restauration, communication, tests trimestriels

---

## 📡 API

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentation complète de l'API
  - REST API endpoints
  - tRPC API
  - Authentification
  - Exemples de code

---

## 🧪 Tests

- **[../apps/frontend/tests/TESTING_GUIDE.md](../apps/frontend/tests/TESTING_GUIDE.md)** - Guide de tests
  - Tests unitaires (Vitest)
  - Tests E2E (Playwright)
  - Patterns et best practices

---

## 🚀 CI/CD

- **[../.github/workflows/CI_CD_GUIDE.md](../.github/workflows/CI_CD_GUIDE.md)** - Guide CI/CD
  - GitHub Actions
  - Pipeline de déploiement
  - Caching et optimisations

---

## 📊 Monitoring

- **[../MONITORING_GUIDE.md](../MONITORING_GUIDE.md)** - Guide monitoring
  - Sentry configuration
  - Core Web Vitals
  - Business Analytics

---

## 📋 Bilans des Phases

- **[../PHASE1_BILAN.md](../PHASE1_BILAN.md)** - Phase 1: Tests
- **[../PHASE2_BILAN.md](../PHASE2_BILAN.md)** - Phase 2: CI/CD
- **[../PHASE3_BILAN.md](../PHASE3_BILAN.md)** - Phase 3: Monitoring
- **[../PHASE4_BILAN.md](../PHASE4_BILAN.md)** - Phase 4: Documentation

---

## 🔍 Navigation Rapide

### Je veux...
- **Installer le projet / onboarding** → [ONBOARDING.md](./ONBOARDING.md) ou [SETUP.md](../SETUP.md)
- **Comprendre l'architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Contribuer** → [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Développer** → [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- **Utiliser l'API** → [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Résoudre un problème** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Réagir à un incident** → [runbooks/](./runbooks/) (DB, Redis, Stripe, deploy)
- **Restauration / catastrophe** → [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
- **Écrire des tests** → [TESTING_GUIDE.md](../apps/frontend/tests/TESTING_GUIDE.md) ou [docs/TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Configurer CI/CD** → [CI_CD_GUIDE.md](../.github/workflows/CI_CD_GUIDE.md) ou [MULTI_ENVIRONMENT_CI_CD.md](./MULTI_ENVIRONMENT_CI_CD.md)
- **Configurer monitoring** → [MONITORING_GUIDE.md](../MONITORING_GUIDE.md) ou [PERFORMANCE_MONITORING.md](./PERFORMANCE_MONITORING.md)

---

## 📊 Structure de la Documentation

```
luneo-platform/
├── README.md                    # Vue d'ensemble
├── SETUP.md                     # Guide d'installation
├── ARCHITECTURE.md              # Architecture
├── CONTRIBUTING.md              # Guide de contribution
├── docs/
│   ├── README.md                # Ce fichier (index)
│   ├── ONBOARDING.md            # Developer onboarding
│   ├── DISASTER_RECOVERY.md     # Plan de reprise (RPO/RTO, procédures, communication)
│   ├── runbooks/                # Runbooks incidents
│   │   ├── README.md            # Index runbooks
│   │   ├── database-down.md     # P1 DB
│   │   ├── redis-down.md        # P2 Redis
│   │   ├── stripe-down.md       # P2 Stripe
│   │   └── deploy-failed.md     # P1 Deploy
│   ├── API_DOCUMENTATION.md     # Documentation API
│   ├── DEVELOPMENT_GUIDE.md     # Guide de développement
│   ├── TROUBLESHOOTING.md       # Guide troubleshooting
│   └── ...                      # Autres guides (voir INDEX.md)
├── apps/frontend/tests/
│   └── TESTING_GUIDE.md         # Guide de tests
├── .github/workflows/
│   └── CI_CD_GUIDE.md           # Guide CI/CD
├── MONITORING_GUIDE.md          # Guide monitoring
└── PHASE*_BILAN.md              # Bilans des phases
```

---

## 🔗 Ressources Externes

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Dernière mise à jour:** Février 2025
