# 🚀 Guide de Déploiement Staging

**Date**: 16 novembre 2025  
**Status**: ⏳ **EN ATTENTE DE MERGE PR #1**

---

## 📋 Prérequis

### 1. PR #1 Mergée
- [ ] PR #1 approuvée et mergée vers `main`
- [ ] Tous les checks CI passent
- [ ] Code sur `main` à jour

### 2. Migrations Prisma
- [ ] Migration `20251116000000_add_shopify_install` créée
- [ ] Staging DB accessible
- [ ] Variables d'environnement DB configurées

### 3. Variables d'Environnement Staging

#### Backend (NestJS)
```bash
# Database
DATABASE_URL=postgresql://user:pass@staging-db:5432/luneo_staging
DIRECT_URL=postgresql://user:pass@staging-db:5432/luneo_staging

# JWT
JWT_SECRET=your-staging-jwt-secret-32-chars-minimum
JWT_PUBLIC_KEY=your-staging-jwt-public-key

# Redis
REDIS_URL=redis://staging-redis:6379
UPSTASH_REDIS_REST_URL=https://your-upstash-redis.rest.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Shopify
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret

# Encryption
MASTER_ENCRYPTION_KEY=your-32-char-hex-encryption-key

# AWS (si utilisé)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Stripe (staging)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# App
APP_URL=https://staging.luneo.app
NODE_ENV=staging
```

#### Frontend (Next.js)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# API
NEXT_PUBLIC_API_URL=https://api-staging.luneo.app

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
```

---

## 🔄 Étapes de Déploiement

### Étape 1: Appliquer Migrations Prisma

```bash
# Se connecter au serveur staging
ssh user@staging-server

# Aller dans le répertoire de l'application
cd /path/to/luneo-platform

# Appliquer les migrations
cd apps/backend
npx prisma migrate deploy
```

**Vérification:**
```bash
# Vérifier que la table ShopifyInstall existe
npx prisma studio
# Ou via SQL
psql $DATABASE_URL -c "\d \"ShopifyInstall\""
```

---

### Étape 2: Déployer Backend

#### Option A: Via Docker Compose (Recommandé)

```bash
# Sur le serveur staging
cd /path/to/luneo-platform

# Pull latest code
git pull origin main

# Build et restart
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.staging.yml logs -f backend
```

#### Option B: Via Vercel (si backend déployé sur Vercel)

```bash
# Depuis votre machine locale
cd apps/backend
vercel --prod --env=staging
```

---

### Étape 3: Déployer Frontend

```bash
# Via Vercel (recommandé)
cd apps/frontend
vercel --prod --env=staging

# Ou via build manuel
npm run build
npm run start
```

---

### Étape 4: Déployer Worker IA

```bash
# Sur le serveur staging ou Railway/Render
cd apps/worker-ia

# Install dependencies
pnpm install

# Build
pnpm build

# Start worker
pnpm start
```

---

## 🧪 Smoke Tests Staging

### 1. Health Checks

```bash
# Backend health
curl https://api-staging.luneo.app/health

# Frontend health
curl https://staging.luneo.app/api/health
```

### 2. Test Shopify OAuth Flow

1. Accéder à: `https://api-staging.luneo.app/api/shopify/install?shop=test.myshopify.com&brandId=test-brand`
2. Vérifier redirection vers Shopify
3. Compléter OAuth flow
4. Vérifier callback et stockage dans DB

### 3. Test Widget Handshake

1. Charger widget sur page test
2. Vérifier token generation: `GET /api/v1/embed/token?shop=test.myshopify.com`
3. Vérifier iframe handshake avec postMessage
4. Vérifier nonce validation

### 4. Test 3D Selection Tool

1. Accéder à l'éditeur 3D
2. Sélectionner des faces
3. Upload mask: `POST /api/designs/:id/masks`
4. Vérifier stockage dans Cloudinary/S3

### 5. Test Worker Render Job

1. Créer un design
2. Déclencher render job
3. Vérifier traitement dans worker
4. Vérifier upload résultat

### 6. Test Billing Endpoints

```bash
# Usage query
curl https://api-staging.luneo.app/api/usage-billing/tenant/:brandId/usage

# Stripe webhook (simulation)
curl -X POST https://api-staging.luneo.app/api/billing/webhook \
  -H "stripe-signature: ..." \
  -d @test-webhook.json
```

### 7. Test GDPR Endpoints

```bash
# Export user data
curl -X POST https://api-staging.luneo.app/api/data/export?userId=test-user \
  -H "Authorization: Bearer $TOKEN"

# Delete user data
curl -X DELETE https://api-staging.luneo.app/api/data/erase?userId=test-user \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Monitoring Post-Déploiement

### 1. Vérifier Logs

```bash
# Backend logs
docker-compose -f docker-compose.staging.yml logs -f backend

# Worker logs
docker-compose -f docker-compose.staging.yml logs -f worker-ia

# Frontend logs (Vercel)
vercel logs staging.luneo.app
```

### 2. Vérifier Métriques

- **Prometheus**: `http://staging-prometheus:9090`
- **Grafana**: `http://staging-grafana:3000`
- **Sentry**: Dashboard Sentry pour erreurs

### 3. Vérifier Performance

- Temps de réponse API < 200ms
- Taux d'erreur < 1%
- Queue wait time < 60s
- Coûts OpenAI dans les limites

---

## 🚨 Rollback Plan

Si problème détecté:

```bash
# Rollback Git
git checkout main
git reset --hard HEAD~1
git push origin main --force

# Rollback DB migration (si nécessaire)
cd apps/backend
npx prisma migrate resolve --rolled-back 20251116000000_add_shopify_install

# Restart services
docker-compose -f docker-compose.staging.yml restart
```

---

## ✅ Checklist Complète

- [ ] PR #1 mergée vers main
- [ ] Migrations Prisma appliquées sur staging DB
- [ ] Variables d'environnement configurées
- [ ] Backend déployé et healthy
- [ ] Frontend déployé et accessible
- [ ] Worker IA démarré
- [ ] Smoke tests passés
- [ ] Monitoring actif
- [ ] Documentation mise à jour

---

**🎉 Une fois tous les checks passés, prêt pour production !**

