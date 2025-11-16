# OWASP ZAP Baseline Scan

Ce référentiel fournit un workflow automatisé pour exécuter un scan OWASP ZAP (mode baseline) contre les environnements Luneo.

## Scripts disponibles

- `npm run security:owasp`  
  Lance un conteneur `owasp/zap2docker-stable` et génère un rapport HTML + JSON dans `reports/security/`.  
  - Utilise l’URL `http://localhost:3000` par défaut (modifiable : `npm run security:owasp -- https://staging.luneo.app`).  
  - Nécessite que l’application soit déjà accessible sur l’URL cible.

- `npm run security:all`  
  Exécute :
  1. `npm run security:audit` (audit dépendances en mode `--prod --audit-level=high`)  
  2. `pnpm audit --audit-level=moderate`  
  3. `npm run security:owasp`

## Rapport

Les rapports sont stockés dans `reports/security/` et ignorés par Git.  
Le HTML offre un aperçu synthétique ; le JSON peut être intégré à des outils externes (Grafana, DefectDojo).

## GitHub Actions

Le workflow `.github/workflows/security-owasp.yml` exécute automatiquement le scan baseline chaque semaine (cron) et sur demande (`workflow_dispatch`). Les artefacts HTML/JSON sont exportés pour revue par l’équipe sécurité.

### Secrets requis (en CI)

| Secret | Description |
| ------ | ----------- |
| `OWASP_BASE_URL` | URL de l’environnement à scanner (par défaut staging). |

## Recommandations

- Couvrir les environnements `staging` et `production` (mode read-only).  
- Analyser les alertes `High` / `Medium` en priorité (risques XSS, Mixed Content, TLS).  
- Intégrer les findings critiques dans le backlog sécurité (Jira) avec SLA adaptés.

