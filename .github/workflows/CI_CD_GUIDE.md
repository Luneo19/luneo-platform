# 📚 Guide CI/CD Pipeline - Luneo Platform

**Documentation complète du pipeline CI/CD**

---

## 📋 Vue d'Ensemble

Le pipeline CI/CD de Luneo Platform est configuré dans `.github/workflows/ci.yml` et s'exécute automatiquement sur:
- **Push** vers `main`, `develop`, `staging`
- **Pull Requests** vers `main`, `develop`

---

## 🔄 Flux du Pipeline

```
┌─────────┐
│  Lint   │
└────┬────┘
     │
     ├──────────────┐
     │              │
┌────▼────┐    ┌────▼─────┐
│  Unit   │    │   E2E    │
│  Tests  │    │  Tests   │
└────┬────┘    └────┬─────┘
     │              │
     └──────┬───────┘
            │
      ┌─────▼─────┐
      │   Build   │
      └─────┬─────┘
            │
     ┌──────┴──────┐
     │             │
┌────▼────┐  ┌─────▼──────┐
│ Staging │  │ Production │
│ Deploy  │  │   Deploy   │
└─────────┘  └────────────┘
```

---

## 📦 Jobs Détaillés

### 1. Lint & Type Check

**Job:** `lint`  
**Durée:** ~2-3 minutes  
**Timeout:** 10 minutes

**Étapes:**
1. Checkout du code
2. Setup pnpm
3. Setup Node.js (avec cache pnpm)
4. Cache pnpm store
5. Installation des dépendances
6. Lint (`pnpm --filter luneo-frontend run lint:check`)
7. Type check (`pnpm --filter luneo-frontend run type-check`)

**Cache:**
- pnpm store directory

---

### 2. Unit Tests

**Job:** `unit-tests`  
**Durée:** ~5-8 minutes  
**Timeout:** 15 minutes  
**Dépendances:** `lint`

**Étapes:**
1. Checkout du code
2. Setup pnpm
3. Setup Node.js (avec cache pnpm)
4. Cache pnpm store
5. Installation des dépendances
6. Exécution des tests avec coverage
7. Upload coverage vers Codecov
8. Upload artifacts (coverage report)

**Artifacts:**
- Coverage report (HTML, JSON, lcov)
- Retention: 30 jours

**Coverage:**
- Uploadé vers Codecov avec flag `unittests`
- Fichier: `apps/frontend/coverage/lcov.info`

---

### 3. E2E Tests

**Job:** `e2e-tests`  
**Durée:** ~10-15 minutes  
**Timeout:** 30 minutes  
**Dépendances:** `lint` (parallèle avec `unit-tests`)

**Étapes:**
1. Checkout du code
2. Setup pnpm
3. Setup Node.js (avec cache pnpm)
4. Cache pnpm store
5. Cache Playwright browsers
6. Installation des dépendances
7. Installation des navigateurs Playwright (chromium, firefox, webkit)
8. Build du frontend
9. Exécution des tests E2E (Chromium)
10. Exécution des tests cross-browser
11. Upload des résultats (toujours)
12. Upload des résultats en cas d'échec

**Cache:**
- pnpm store directory
- Playwright browsers (`~/.cache/ms-playwright`)

**Artifacts:**
- Playwright report (toujours)
- Test results (en cas d'échec)
- Retention: 30 jours (report), 7 jours (results)

**Environnement:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

---

### 4. Build

**Job:** `build`  
**Durée:** ~5-8 minutes  
**Timeout:** 20 minutes  
**Dépendances:** `unit-tests`, `e2e-tests`

**Étapes:**
1. Checkout du code
2. Setup pnpm
3. Setup Node.js (avec cache pnpm)
4. Cache pnpm store
5. Cache Next.js build
6. Installation des dépendances
7. Build du frontend
8. Upload des artifacts de build

**Cache:**
- pnpm store directory
- Next.js build cache (`apps/frontend/.next/cache`)

**Artifacts:**
- Build artifacts (`apps/frontend/.next/`)
- Retention: 7 jours

**Environnement:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 5. Deploy to Staging

**Job:** `deploy-staging`  
**Durée:** ~3-5 minutes  
**Timeout:** 15 minutes  
**Dépendances:** `build`  
**Condition:** `develop` ou `staging` branch

**Étapes:**
1. Checkout du code
2. Déploiement vers Vercel (Staging)
3. Attente de 30 secondes
4. Health check
5. Notification Slack (si succès)

**Environnement GitHub:**
- `staging`
- URL: `https://staging.luneo.app`

**Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

### 6. Deploy to Production

**Job:** `deploy-production`  
**Durée:** ~3-5 minutes  
**Timeout:** 15 minutes  
**Dépendances:** `build`  
**Condition:** `main` branch

**Étapes:**
1. Checkout du code
2. Déploiement vers Vercel (Production)
3. Attente de 30 secondes
4. Health check
5. Notification Slack (si succès)

**Environnement GitHub:**
- `production`
- URL: `https://app.luneo.app`

**Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

### 7. Notify

**Job:** `notify`  
**Durée:** ~10 secondes  
**Dépendances:** `build`, `deploy-staging`, `deploy-production`  
**Condition:** `always()` (s'exécute toujours)

**Étapes:**
1. Notification Slack en cas de succès
2. Notification Slack en cas d'échec

**Secrets:**
- `SLACK_WEBHOOK_URL`

---

## 🔐 Sécurité

### Permissions
Le workflow utilise des permissions minimales:
```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
  actions: read
```

### Secrets Utilisés
- `VERCEL_TOKEN` - Token d'authentification Vercel
- `VERCEL_ORG_ID` - ID de l'organisation Vercel
- `VERCEL_PROJECT_ID` - ID du projet Vercel
- `SLACK_WEBHOOK_URL` - Webhook Slack pour notifications
- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase (public)
- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe
- `CODECOV_TOKEN` - Token Codecov (optionnel)
- `TURBO_TOKEN` - Token Turbo (optionnel)
- `TURBO_TEAM` - Équipe Turbo (variable)

---

## ⚡ Optimisations

### Cache
- **pnpm store:** Cache partagé entre tous les jobs
- **Playwright browsers:** Cache des navigateurs (~500MB)
- **Next.js build:** Cache du build Next.js

### Parallélisation
- `unit-tests` et `e2e-tests` s'exécutent en parallèle
- Réduction du temps total du pipeline

### Timeouts
- Tous les jobs ont des timeouts pour éviter les blocages
- Timeouts conservateurs pour éviter les faux positifs

---

## 📊 Métriques

### Temps de Pipeline
- **Sans cache:** ~25-30 minutes
- **Avec cache:** ~15-20 minutes
- **Réduction:** ~40%

### Coûts
- **Minutes CI:** Réduites de ~40% grâce au cache
- **Coûts:** Proportionnels aux minutes

---

## 🐛 Dépannage

### Job échoue
1. Vérifier les logs du job
2. Vérifier les artifacts (coverage, test results)
3. Vérifier les notifications Slack

### Cache invalide
- Le cache est invalidé automatiquement lors de changements dans `pnpm-lock.yaml`
- Le cache Next.js est invalidé lors de changements dans les fichiers source

### Health check échoue
- Le health check utilise `continue-on-error: true`
- Peut être dû à un délai de propagation (30s peut ne pas être suffisant)
- Vérifier manuellement l'URL après déploiement

---

## 🔄 Workflows Obsolètes

Les workflows suivants sont obsolètes et peuvent être supprimés:
- `deploy-luneo.yml` - Doublon de `ci.yml`
- `production-deploy.yml` - Doublon de `ci.yml` (mais contient des health checks utiles)

**Note:** `deploy-production.yml` est pour le backend et doit être conservé.

---

## 📝 Notes

- Les health checks utilisent `continue-on-error: true` pour ne pas bloquer le pipeline
- Les notifications Slack utilisent `continue-on-error: true` pour ne pas bloquer le pipeline
- Le cache est partagé entre tous les jobs d'un même run
- Les timeouts sont conservateurs pour éviter les faux positifs

---

## 🔗 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Action](https://github.com/amondnet/vercel-action)
- [Playwright Documentation](https://playwright.dev/)
- [Codecov Documentation](https://docs.codecov.com/)










