# Resilience Drills

## Scénarios à simuler chaque mois

1. Redis indisponible
2. Database latence élevée
3. Provider email indisponible
4. Webhook Stripe en échec intermittent
5. Déploiement rollback en moins de 10 minutes

## Critères de réussite

- Détection automatique par alerting.
- Triage incident < 10 minutes.
- Mitigation appliquée < 30 minutes.
- Post-mortem publié sous 24h.

## Artefacts attendus

- Timeline incident
- Root cause
- Actions préventives
- Owner + deadline par action
