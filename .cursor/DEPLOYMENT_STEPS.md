# 🚀 Étapes de Déploiement Production

## Date: 2024-12-19

---

## 📋 Étape 1: Configuration Variables d'Environnement

### Option A: Via Scripts Interactifs

#### Backend Vercel
```bash
cd /Users/emmanuelabougadous/luneo-platform
./scripts/configure-vercel-env.sh production backend
```

#### Frontend Vercel
```bash
./scripts/configure-vercel-env.sh production frontend
```

#### Railway
```bash
./scripts/configure-railway-env.sh
```

### Option B: Via CLI Manuel

#### Vercel Backend
```bash
cd apps/backend
vercel env add DATABASE_URL production
vercel env add REDIS_HOST production
vercel env add JWT_SECRET production
# ... (voir liste complète dans PRE_DEPLOYMENT_GUIDE.md)
```

#### Vercel Frontend
```bash
cd apps/frontend
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_WIDGET_URL production
# ... (voir liste complète)
```

#### Railway
```bash
cd apps/backend
railway variables set DATABASE_URL="postgresql://..."
railway variables set REDIS_HOST="..."
railway variables set JWT_SECRET="..."
# ... (voir liste complète)
```

---

## 📋 Étape 2: Vérifications

### Vérifier Redis
```bash
./scripts/verify-redis.sh redis://localhost:6379
# Ou avec Railway: ./scripts/verify-redis.sh ${{Redis.REDIS_URL}}
```

### Configurer S3
```bash
./scripts/configure-s3.sh
```

### Tester les Endpoints
```bash
# Local (si API démarrée)
./scripts/test-endpoints.sh http://localhost:3001 test-api-key

# Production (après déploiement)
./scripts/test-endpoints.sh https://api.luneo.app your-api-key
```

---

## 📋 Étape 3: Déploiement

### Option A: Script Automatisé (Recommandé)
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

## 📋 Étape 4: Vérification Post-Déploiement

### Vérifier les URLs
```bash
# Backend (Railway)
railway open
# Ou vérifier dans Railway Dashboard

# Frontend (Vercel)
vercel ls
# Ou vérifier dans Vercel Dashboard
```

### Tester les Endpoints
```bash
# Health Check
curl https://api.luneo.app/api/v1/health

# Widget API
curl -H "X-API-Key: your-api-key" \
  https://api.luneo.app/api/widget/products/demo-product-123
```

### Vérifier les Logs
```bash
# Railway
railway logs

# Vercel
vercel logs
```

---

## 🎯 Checklist Complète

### Avant Déploiement
- [ ] Variables Vercel backend configurées
- [ ] Variables Vercel frontend configurées
- [ ] Variables Railway configurées (si utilisé)
- [ ] Redis vérifié
- [ ] S3 configuré
- [ ] Endpoints testés localement

### Déploiement
- [ ] Backend déployé
- [ ] Frontend déployé
- [ ] URLs récupérées

### Après Déploiement
- [ ] Health check OK
- [ ] Endpoints API testés
- [ ] Frontend accessible
- [ ] Widget fonctionnel
- [ ] Logs vérifiés

---

## 🆘 Dépannage

### Erreur: Variables manquantes
```bash
# Vérifier les variables
vercel env ls
railway variables
```

### Erreur: Build échoué
```bash
# Vérifier les logs
vercel logs
railway logs
```

### Erreur: Connexion Database
- Vérifier DATABASE_URL
- Vérifier les credentials
- Vérifier le firewall

### Erreur: Redis non accessible
- Vérifier REDIS_HOST/REDIS_URL
- Vérifier les credentials
- Vérifier la configuration réseau

---

## 📝 Notes Importantes

1. **Railway recommandé pour backend** (meilleur support node-canvas)
2. **Vercel recommandé pour frontend** (optimisé Next.js)
3. **Variables d'environnement** doivent être configurées avant déploiement
4. **Redis requis** pour BullMQ (queues de rendu)
5. **S3 requis** pour storage (rendus, assets)

---

## 🎉 Prêt !

Une fois toutes les étapes complétées, votre application sera en production !






