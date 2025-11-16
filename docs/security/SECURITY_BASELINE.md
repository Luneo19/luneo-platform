# Sécurité – Baseline Opérationnelle

Ce document formalise les contrôles minimum à respecter pour exploiter la plateforme Luneo en production mondiale.

## 1. Gestion des secrets

- **Source unique** : toutes les clés/API/credentials sont stockées dans un secret manager (AWS Secrets Manager ou HashiCorp Vault). Aucun secret ne doit être commité dans Git.
- **Injection runtime** : les environnements (CI, staging, production) injectent les secrets via variables d’environnement. Les fichiers `.env` sont réservés au développement local et nentrent pas en production.
- **Rotation** : cycle de rotation à 90 jours pour les clés critiques (Stripe, Cloudinary, providers IA). La révocation est automatisée via runbook.
- **Audit** : chaque accès à un secret est journalisé ; alertes Sentry/PagerDuty sont déclenchées sur comportement anormal (ex. lecture massive).

## 2. Hygiène dépendances

- **Dependabot** (fichier `.github/dependabot.yml`) ouvre des PRs hebdomadaires pour npm (racine, backend, frontend) et GitHub Actions.
- **Scans CI** : le job `security` exécute `pnpm audit` avec seuil `high` et `moderate`. Les builds échouent s’il existe une vulnérabilité sans correction ou justification documentée.
- **Politique de merge** : aucune PR ne doit être fusionnée avec un audit en état `failed`. Ajouter une note `SECURITY: accepted risk` si risque accepté temporairement.

## 3. Headers & middlewares

- `helmet` est activé par défaut (CSP strict en production).
- Protection DoS via `express-rate-limit` + `slow-down`, `hpp`, compression. Les seuils se configurent dans `app.rateLimit*`.
- CORS whitelisté dans `app.corsOrigin` (préférence pour des domaines explicites en production).

## 4. RGPD / Confidentialité

- Données personnelles: minification & pseudonymisation (IDs, tokens). Les logs ne doivent pas contenir d’email ni de prompt IA brut.
- Délai de conservation : définir TTL par entité (ordres, designs, prompts). Les scripts de purge sont déclenchés hebdomadairement.
- Droit à l’oubli : endpoint `/gdpr/delete-account` supprime compte + usages queue. Vérifier absence de copies dans caches (Redis, jobs).
- Traçabilité : toute opération d’administration crée un log structuré (winston + Sentry breadcrumb).

## 5. Conformité applicative

- **Authentification** : JWT signés en HS512, refresh tokens en base chiffrée (bcrypt). Double vérification sur endpoints critiques (plan, facturation).
- **RBAC** : `rbac.service.ts` gère rôles/permissions ; aucune route ne doit s’appuyer sur la valeur brute de `req.user.role`.
- **Validation** : DTO + `ValidationPipe` forbident non-whitelist ; chaque payload externe (webhook, IA provider) est validé via schémas Zod ou class-validator.

## 6. Monitoring & alertes

- **Prometheus** + `QueueMetricsService` → dashboards Grafana (temps d’attente, jobs en échec).
- **Sentry** : alertes `QueueHealthAlertService`, crash backend, latence > SLO.
- **Audit trail** : `logs/` structurés JSON (niveau `info`, `warn`, `error`). Conserver 90 jours.

## 7. Runbooks sécurité

- **Incident response** : runbook `docs/security/INCIDENT_RESPONSE.md` (à compléter) avec étapes triage → mitigation → post mortem.
- **Pentest** : campagne semestrielle ; intégrer rapport & remédiations dans backlog sécurité.
- **Formations** : onboarding sécurité pour nouvelles recrues (gestion secrets, bonnes pratiques IA/PII).

---

> Mainteneur : **Security Champion** désigné ; revue trimestrielle des contrôles. Toute modification de cette baseline doit être approuvée par la gouvernance technique.***

