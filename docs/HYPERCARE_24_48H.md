# Plan Hypercare 24h/48h

Dernière mise à jour: 2026-03-01

Objectif: stabiliser la production juste après release et réduire le MTTR.

## Fenêtre 0-2h (surveillance renforcée)

- Vérifier toutes les 15 min:
  - `https://luneo.app` (200)
  - `https://api.luneo.app/health` (`status: ok`)
  - erreurs 5xx backend
  - volume de `failed_jobs` / DLQ
- Contrôler les flux critiques:
  - login/refresh/logout
  - webhook Stripe
  - envoi de message planifié
  - endpoint public API principal

## Fenêtre 2-24h (surveillance active)

- Vérifier toutes les 60 min:
  - latence P95 API
  - erreurs auth
  - quota/rate-limit anomalies
  - incidents webhook (retry/replay)
- Revue de drift:
  - docs vs workflow réel
  - incidents ouverts vs runbooks existants

## Fenêtre 24-48h (consolidation)

- Rédiger post-mortem léger même sans incident majeur:
  - ce qui s’est bien passé
  - alertes déclenchées
  - actions d’amélioration
- Clore les tickets hypercare:
  - observabilité
  - sécurité
  - fiabilité jobs async

## KPI hypercare à suivre

- Availability frontend/backend
- Taux d’erreur 5xx
- Latence API P95/P99
- Taux d’échec webhooks
- Nombre de jobs en échec (scheduled/webhooks)
- Taux d’échec login/refresh

## RACI minimum

- **Incident Commander**: coordination et décision rollback
- **Backend Owner**: API, jobs, webhooks, DB
- **Frontend Owner**: routes critiques, auth proxy, UX incidents
- **DevOps Owner**: déploiement, logs, rollback, environnements
- **Security Owner**: incidents sécurité, secrets, conformité

## Déclencheurs rollback immédiat

- indisponibilité backend > 5 min
- indisponibilité frontend > 5 min
- incident sécurité confirmé
- erreur massive sur auth/paiement

## Clôture hypercare

- 48h sans incident P0/P1
- tendances stables sur KPI critiques
- actions correctives planifiées avec owner/date
