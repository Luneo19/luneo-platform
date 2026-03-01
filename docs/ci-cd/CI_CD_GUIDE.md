# Guide CI/CD (État Réel)

Dernière mise à jour: 2026-03-01  
Source de vérité: workflows dans `.github/workflows/`

## Vue d’ensemble

Le flux actif est centré sur un **quality gate unique** puis un **déploiement manuel contrôlé**:

1. `ci.yml` exécute `quality-release` sur `push/pull_request` vers `main`
2. `deploy-production.yml` (manuel `workflow_dispatch`) vérifie qu’un run `ci.yml` du commit est vert
3. Déploie backend Railway et/ou frontend Vercel
4. Exécute des smoke tests post-déploiement

## Workflow `ci.yml`

- **Nom du job**: `quality-release`
- **Déclencheurs**:
  - `pull_request` vers `main`
  - `push` vers `main`
- **Étapes clés**:
  - `pnpm install --frozen-lockfile`
  - `pnpm exec prisma generate` (backend)
  - `pnpm run quality:release`
  - upload artefact `quality-release-metadata`

`quality:release` couvre:
- lint release
- type-check release
- tests release ciblés
- build frontend + backend + ai-engine
- migration readiness backend (DB requise)
- smoke critique (auth/admin obligatoire)
- smoke post-login tunnel (credentials obligatoires)

## Workflow `deploy-production.yml`

- **Type**: manuel (`workflow_dispatch`)
- **Input**: `target = all | backend | frontend | widget`
- **Précondition bloquante**: un run `ci.yml` vert sur le SHA courant

### Déploiement backend
- CLI Railway versionnée (`@railway/cli@4.16.1`)
- `railway up --service backend --environment production`

### Déploiement frontend
- CLI Vercel versionnée (`vercel@46.0.2`)
- `vercel pull --environment=production`
- `vercel --prod --yes`

### Post-deploy
- smoke critique obligatoire
- smoke post-login tunnel obligatoire
- upload des artefacts smoke

## Règles de release recommandées

- Toute prod passe par:
  1) merge/push  
  2) CI verte  
  3) `deploy-production.yml` manuel
- Aucun déploiement direct hors workflow sans traçabilité

## Secrets requis (minimum)

- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SMOKE_ADMIN_EMAIL`
- `SMOKE_ADMIN_PASSWORD`
- `SMOKE_USER_EMAIL`
- `SMOKE_USER_PASSWORD`
- `DATABASE_URL_TEST` (gates migration/readiness en CI)

## Notes importantes

- Cette doc remplace les anciens schémas multi-jobs linéaires (lint/unit/e2e/build séparés dans `ci.yml`) qui ne correspondent plus au workflow actuel.
- Pour les contrôles supplémentaires (perf, e2e quality gates, rollback drill), voir les workflows dédiés dans `.github/workflows/`.
