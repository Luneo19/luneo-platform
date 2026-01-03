# 🚀 Exécution du Déploiement - Guide Pas à Pas

## 📋 Étape 1: Configuration Variables Vercel

### Backend Vercel
```bash
cd /Users/emmanuelabougadous/luneo-platform
./scripts/configure-vercel-env.sh production backend
```

**Réponses attendues:**
- DATABASE_URL: Votre URL PostgreSQL
- REDIS_HOST: Votre host Redis
- REDIS_PORT: 6379 (ou votre port)
- AWS_ACCESS_KEY_ID: Votre clé AWS
- AWS_SECRET_ACCESS_KEY: Votre secret AWS
- AWS_REGION: eu-west-1 (ou votre région)
- AWS_S3_BUCKET: Votre bucket S3
- FRONTEND_URL: https://app.luneo.app (ou votre URL)
- CORS_ORIGIN: https://app.luneo.app (ou votre URL)

### Frontend Vercel
```bash
./scripts/configure-vercel-env.sh production frontend
```

**Réponses attendues:**
- NEXT_PUBLIC_API_URL: https://api.luneo.app (ou votre URL backend)
- NEXT_PUBLIC_WIDGET_URL: https://cdn.luneo.app/widget/v1/luneo-widget.iife.js
- NEXT_PUBLIC_APP_URL: https://app.luneo.app (ou votre URL)

---

## 📋 Étape 2: Configuration Railway

```bash
./scripts/configure-railway-env.sh
```

**Réponses attendues:**
- REDIS_HOST: Utiliser Railway Redis service (${{Redis.REDIS_HOST}})
- AWS_ACCESS_KEY_ID: Votre clé AWS
- AWS_SECRET_ACCESS_KEY: Votre secret AWS
- AWS_REGION: eu-west-1
- AWS_S3_BUCKET: Votre bucket S3
- FRONTEND_URL: https://app.luneo.app
- CORS_ORIGIN: https://app.luneo.app

**Note:** DATABASE_URL est généré automatiquement si PostgreSQL est ajouté dans Railway.

---

## 📋 Étape 3: Vérification Redis

```bash
# Si Redis local
./scripts/verify-redis.sh redis://localhost:6379

# Si Redis Railway
./scripts/verify-redis.sh ${{Redis.REDIS_URL}}

# Si Redis Upstash/Vercel
./scripts/verify-redis.sh rediss://default:password@host:6379
```

---

## 📋 Étape 4: Configuration S3

```bash
./scripts/configure-s3.sh
```

**Réponses attendues:**
- AWS Access Key ID: Votre clé AWS
- AWS Secret Access Key: Votre secret AWS
- AWS Region: eu-west-1
- S3 Bucket Name: luneo-storage (ou votre bucket)

---

## 📋 Étape 5: Test des Endpoints (Optionnel)

```bash
# Si API locale démarrée
./scripts/test-endpoints.sh http://localhost:3001 test-api-key

# Après déploiement
./scripts/test-endpoints.sh https://api.luneo.app your-api-key
```

---

## 📋 Étape 6: Déploiement

### Option A: Script Automatisé
```bash
./scripts/deploy-production.sh
```

### Option B: Déploiement Manuel

#### Backend sur Railway (Recommandé)
```bash
cd apps/backend
railway up
```

#### Backend sur Vercel (Alternative)
```bash
cd apps/backend
vercel --prod
```

#### Frontend sur Vercel
```bash
cd apps/frontend
vercel --prod
```

---

## ✅ Vérification Post-Déploiement

### Vérifier les URLs
```bash
# Railway
railway open

# Vercel
vercel ls
```

### Tester Health Check
```bash
curl https://api.luneo.app/api/v1/health
```

### Tester Widget API
```bash
curl -H "X-API-Key: your-api-key" \
  https://api.luneo.app/api/widget/products/demo-product-123
```

---

## 🎯 Commandes Rapides

### Tout configurer en une fois
```bash
# 1. Backend Vercel
./scripts/configure-vercel-env.sh production backend

# 2. Frontend Vercel
./scripts/configure-vercel-env.sh production frontend

# 3. Railway
./scripts/configure-railway-env.sh

# 4. Redis
./scripts/verify-redis.sh <REDIS_URL>

# 5. S3
./scripts/configure-s3.sh

# 6. Déployer
./scripts/deploy-production.sh
```

---

## 📝 Notes

- Les scripts sont interactifs et vous guideront
- Les clés JWT sont générées automatiquement
- DATABASE_URL sur Railway est généré automatiquement
- Vérifiez les variables après configuration: `vercel env ls` ou `railway variables`

---

**Prêt à déployer !** 🚀

