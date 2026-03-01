# Runbook Railway + Vercel 2026

## Scope
- Backend NestJS sur Railway
- Frontend Next.js sur Vercel
- Base PostgreSQL + Redis + BullMQ

## 1) Incident: queue backlog explose
### Symptomes
- Delais reponse IA en hausse
- Jobs `learning` / `summarization` / `analytics-aggregation` en attente

### Actions immediates
1. Verifier Redis et latence reseau.
2. Identifier la queue la plus chargee.
3. Augmenter provisoirement la concurrence workers.
4. Purger uniquement jobs dupliques evidents (jamais les jobs metier uniques).

### Post-mortem
- Ajuster `attempts`, `backoff`, `concurrency`.
- Ajouter alerte proactive sur taille queue et age moyen job.

## 2) Incident: chute du taux de resolution IA
### Symptomes
- Hausse escalades `low_confidence`
- Diminution reponses avec sources

### Actions immediates
1. Verifier disponibilite provider LLM principal et fallback.
2. Verifier freshness de la base de connaissance (indexing jobs).
3. Verifier feature flags de guardrails.
4. Basculer temporairement vers modele plus robuste si necessaire.

### Post-mortem
- Revoir seuil `confidenceThreshold` par verticale.
- Corriger gaps knowledge les plus frequents.

## 3) Incident: billing incoherent
### Symptomes
- Ecart entre Stripe et usage interne
- Factures contestees

### Actions immediates
1. Lancer reconciliation usage/facture pour org impactee.
2. Forcer `syncSubscriptionStatus` pour org concernee.
3. Verifier webhook Stripe reception + idempotence.

### Post-mortem
- Ajouter test regression sur cas de proration/downgrade.
- Durcir surveillance des evenements `invoice.*`.

## 4) Incident: erreurs 5xx backend Railway
### Actions immediates
1. Consulter logs Railway + Sentry transaction trace.
2. Isoler endpoint/module source.
3. Deployer rollback si regression recente confirmee.

### Stabilisation
- Activer mode degrade pour endpoints non-critiques.
- Preserver flux critiques: auth, conversations, billing webhooks.

## 5) Incident: panne frontend Vercel
### Actions immediates
1. Verifier dernier deployment et health checks.
2. Rollback vers build precedent stable.
3. Verifier variables d'environnement runtime Vercel.

## 6) Verification post-incident
- [ ] Flux conversationnel operational
- [ ] Escalades humaines operationnelles
- [ ] Jobs bull actifs sans backlog anormal
- [ ] Billing/webhooks stables
- [ ] KPI metier revenus a la normale
