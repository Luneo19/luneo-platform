# Production Readiness Checklist 2026

## Objectif
Cette checklist formalise les controles obligatoires avant mise en production (Railway backend + Vercel frontend) pour garantir stabilite, securite et observabilite.

## 1) Qualite code et tests
- [ ] `pnpm lint` vert sur tout le monorepo
- [ ] `pnpm type-check` vert sur backend et frontend
- [ ] Tests unitaires critiques verts (orchestrateur, learning, billing, workflows)
- [ ] Tests integration des modules metier verts (verticals, contacts, learning, memory, actions, automation)
- [ ] Tests E2E parcours critiques verts (signup -> onboarding -> conversation -> escalation -> resolve)

## 2) Donnees et migrations
- [ ] Migration Prisma appliquee en staging puis production
- [ ] Aucun champ JSON critique sans validation applicative
- [ ] Index verifies pour conversations, messages, analytics, learning_signals, usage_records
- [ ] Backfill execute pour nouveaux champs non-nullables (si applicable)
- [ ] Plan de rollback migration prepare et teste

## 3) Runtime metier IA
- [ ] Orchestrateur avec idempotence deterministe active
- [ ] Escalade automatique active (score confiance + priorite + raison)
- [ ] Workers actifs: learning, summarization, billing-usage sync, scorecard reports, ROI snapshots
- [ ] Quotas appliques avant inference LLM
- [ ] Tracking usage/cout active sur chaque reponse agent

## 4) Securite
- [ ] JWT + refresh valides en environnement prod
- [ ] CORS/CSP/CSRF configures selon domaine de prod
- [ ] Secrets en variables d'environnement (aucune cle en dur)
- [ ] Rate limiting actif
- [ ] Validation DTO active globalement

## 5) Observabilite et operations
- [ ] Sentry actif (backend + frontend)
- [ ] Health checks verifies
- [ ] Alerting sur erreurs 5xx, latence p95, saturation queue, echecs workers
- [ ] Dashboard KPI metier actif (resolution AI, escalades, ROI, satisfaction)
- [ ] Runbook incident partage et teste avec l'equipe

## 6) Go-live
- [ ] Smoke test end-to-end sur environnement prod-like
- [ ] Verification webhooks Stripe (paid, failed, subscription updated)
- [ ] Verification flux email transactionnels
- [ ] Verification permissions RBAC sur endpoints admin/sensibles
- [ ] Validation finale: CTO/Lead Eng + Product + Ops
