# INDEX DES AGENTS - PROJET LUNEO

**Date**: 2026-02-07  
**Objectif**: Amener Luneo Platform au niveau production world-class

---

## VUE D'ENSEMBLE

Ce document liste tous les agents necessaires pour rendre le projet Luneo production-ready et world-class. Chaque agent est responsable d'un module/feature specifique.

### Legende des Priorites

- **P0** (Bloquant): Bloquer le lancement, impact securite/fonctionnel direct
- **P1** (Critique): Necessaire pour les premiers clients payants
- **P2** (Important): Necessaire pour scale et enterprise
- **P3** (Futur): A evaluer selon demande marche

### Legende des Complexites

- **1** (Simple): 1-2 jours
- **2** (Moyenne): 3-5 jours
- **3** (Complexe): 1-2 semaines
- **4** (Tres Complexe): 2-4 semaines
- **5** (Critique): Requiert architecture complete

---

## AGENTS PAR PHASE

### PHASE A - CRITIQUE (Bloquer le lancement) - 3 semaines

| Agent | Nom | Priorite | Complexite | Estimation | Chantier |
|-------|-----|----------|------------|------------|----------|
| AGENT-10 | Designs & AI Studio | P0 | 4 | 5-8 jours | A1: Composition images |
| AGENT-14 | 3D Configurator | P0 | 2 | 2-3 jours | A2: Config 3D Prisma |
| AGENT-12 | Analytics Dashboard | P0 | 2 | 2-3 jours | A3: Funnels analytics reels |
| AGENT-05 | Auth Flow | P0 | 2 | 3-5 jours | A4: httpOnly cookies |
| AGENT-03 | Tests Coverage | P0 | 4 | 15-20 jours | A5: Tests unitaires 60% |

### PHASE B - HAUTE PRIORITE (Clients payants) - 4-6 semaines

| Agent | Nom | Priorite | Complexite | Estimation | Chantier |
|-------|-----|----------|------------|------------|----------|
| AGENT-15 | API Migration | P1 | 3 | 10-15 jours | B1: Migration 20+ routes API |
| AGENT-09 | Orders & Checkout | P1 | 2 | 3-4 jours | B2: Tracking + remboursements |
| AGENT-16 | Refactoring | P1 | 3 | 5-8 jours | B3: Fichiers >4000 lignes |
| AGENT-17 | SEO | P1 | 2 | 3-5 jours | B4: SEO pages publiques |
| AGENT-06 | Security & RBAC | P1 | 2 | 2-3 jours | B5: RBAC backend forward |
| AGENT-18 | Infra Hardening | P1 | 2 | 3-5 jours | B6: Backup DB + secrets |
| AGENT-19 | Integrations | P1 | 3 | 5-8 jours | B7: Shopify sync complet |

### PHASE C - SCALE / ENTERPRISE - 8-12 semaines

| Agent | Nom | Priorite | Complexite | Estimation | Chantier |
|-------|-----|----------|------------|------------|----------|
| AGENT-18 | Infra Hardening | P2 | 3 | 5-8 jours | C1: CI/CD production |
| AGENT-06 | Security & RBAC | P2 | 3 | 5-8 jours | C2: Enterprise SSO |
| AGENT-18 | Infra Hardening | P2 | 3 | 5-8 jours | C3: Monitoring avance |
| AGENT-20 | Accessibility | P2 | 3 | 5-8 jours | C4: WCAG 2.1 AA |
| AGENT-22 | Error Handling | P2 | 2 | 3-5 jours | C5: Content moderation |
| AGENT-03 | Tests Coverage | P2 | 3 | 10-15 jours | C6: Tests E2E |
| AGENT-21 | Documentation | P2 | 2 | 5-8 jours | C7: Doc operationnelle |

### PHASE D - FUTUR (Selon demande)

| Agent | Nom | Priorite | Estimation | Declencheur |
|-------|-----|----------|------------|-------------|
| AGENT-12 | Analytics Dashboard | P3 | 3-5 sem | >1000 utilisateurs |
| NOUVEAU | Mobile React Native | P3 | 3-4 mois | Demande enterprise |
| AGENT-19 | Integrations | P3 | 2-3 sem | Demande clients |
| AGENT-18 | Infra Hardening | P3 | 2-3 sem | Architecture microservices |
| AGENT-09 | Orders & Checkout | P3 | 2-3 sem | >500 artisans/mois |

---

## DETAILS PAR AGENT

| Agent | Fichier | Statut |
|-------|---------|--------|
| AGENT-01 | `AGENT-01-typescript-corrections.md` | Spec complete |
| AGENT-03 | `AGENT-03-tests-coverage.md` | Spec complete |
| AGENT-05 | `AGENT-05-auth-flow.md` | Spec complete |
| AGENT-06 | `AGENT-06-security-rbac.md` | Spec complete |
| AGENT-08 | `AGENT-08-products-management.md` | Spec complete |
| AGENT-09 | `AGENT-09-orders-checkout.md` | Spec complete |
| AGENT-10 | `AGENT-10-designs-ai-studio.md` | Spec complete |
| AGENT-11 | `AGENT-11-billing-subscriptions.md` | Spec complete |
| AGENT-12 | `AGENT-12-analytics-dashboard.md` | Spec complete |
| AGENT-13 | `AGENT-13-ar-studio.md` | Spec complete |
| AGENT-14 | `AGENT-14-3d-configurator.md` | Spec complete |
| AGENT-15 | `AGENT-15-api-migration.md` | Spec complete |
| AGENT-16 | `AGENT-16-refactoring.md` | Spec complete |
| AGENT-17 | `AGENT-17-seo.md` | Spec complete |
| AGENT-18 | `AGENT-18-infra-hardening.md` | Spec complete |
| AGENT-19 | `AGENT-19-integrations.md` | Spec complete |
| AGENT-20 | `AGENT-20-accessibility.md` | Spec complete |
| AGENT-21 | `AGENT-21-documentation.md` | Spec complete |
| AGENT-22 | `AGENT-22-error-handling.md` | Spec complete |

---

## DEPENDANCES

```
AGENT-05 (Auth) --> AGENT-15 (API Migration)
AGENT-15 (API Migration) --> AGENT-06 (RBAC Backend)
AGENT-01 (TypeScript) --> AGENT-16 (Refactoring)
AGENT-10 (Designs) --> AGENT-16 (Refactoring)
AGENT-14 (3D Config) --> AGENT-10 (Designs - Composition images)
AGENT-03 (Tests unitaires) --> AGENT-03 (Tests E2E)
AGENT-18 (Backup DB) --> AGENT-18 (CI/CD prod)
AGENT-18 (CI/CD prod) --> AGENT-18 (Monitoring)
AGENT-09 (Orders) --> AGENT-19 (Integrations)
AGENT-08 (Products) --> AGENT-19 (Integrations)
AGENT-16 (Refactoring) --> AGENT-20 (Accessibility)
AGENT-18 (Infra) --> AGENT-21 (Documentation)
```

---

## RESUME

- **Total Agents actifs**: 19
- **Agents Phase A (P0)**: 5
- **Agents Phase B (P1)**: 7
- **Agents Phase C (P2)**: 7
- **Estimation totale**: 14-18 semaines
- **Production-ready (A+B)** : ~320h / 8 semaines
- **World-class (A+B+C)** : ~570h / 14 semaines

---

## REGLE FONDAMENTALE

**ZERO SUPABASE**. Tout passe par NestJS + Prisma + PostgreSQL. Aucun import `@/lib/supabase` ne doit subsister.

---

**Derniere mise a jour**: 2026-02-07
