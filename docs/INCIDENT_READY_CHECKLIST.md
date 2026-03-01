# Checklist Incident-Ready

Dernière mise à jour: 2026-03-01

Objectif: garantir que l’équipe peut détecter, contenir et résoudre rapidement un incident production.

## Préparation (avant incident)

- [ ] Runbooks à jour (`docs/runbooks/*`, rollback, post-deploy)
- [ ] Owners d’astreinte clairement définis
- [ ] Canaux de communication incident définis
- [ ] Secrets critiques inventoriés + procédure de rotation
- [ ] Procédure rollback testée au moins en drill

## Détection (T0)

- [ ] Incident confirmé (symptômes + impact)
- [ ] Priorité définie (`P0/P1/P2`)
- [ ] Incident Commander assigné
- [ ] Ticket incident créé (horodatage + scope)

## Containment (T0 + 15 min)

- [ ] Stop déploiements en cours
- [ ] Isoler la surface impactée (feature flag, route, worker)
- [ ] Evaluer rollback immédiat
- [ ] Communication interne envoyée

## Diagnostic (T0 + 30 min)

- [ ] Hypothèse primaire formulée
- [ ] Logs/metrics/smoke vérifiés
- [ ] Vérification auth, webhooks, scheduled jobs, DB
- [ ] Décision: fix forward ou rollback

## Résolution

- [ ] Correctif appliqué et validé
- [ ] Smoke critique exécuté
- [ ] Santé frontend/backend validée
- [ ] Communication de résolution envoyée

## Post-incident (T+24h)

- [ ] RCA documentée
- [ ] Actions préventives planifiées
- [ ] Mise à jour runbooks/docs
- [ ] Leçon opérationnelle partagée

## Données minimales à capturer

- timeline complète
- impact utilisateur/business
- métriques avant/après
- décision rollback/fix et justification
- owner de chaque action corrective
