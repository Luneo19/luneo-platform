# 🚀 Déploiement Staging - Prêt

**Date**: 16 novembre 2025  
**Status**: ⏳ **PR #1 EN ATTENTE D'APPROBATION**

---

## ⚠️ Note Importante

La PR #1 nécessite :
1. **Une approbation externe** (vous ne pouvez pas approuver votre propre PR)
2. **Les checks CI doivent passer** (ou être bypassés avec --admin)

**Actions requises:**
```bash
# Option 1: Approuver manuellement via GitHub UI
# Allez sur: https://github.com/Luneo19/luneo-platform/pull/1
# Cliquez sur "Approve" puis "Merge"

# Option 2: Forcer merge avec admin (si vous avez les droits)
gh pr merge 1 --admin --squash --delete-branch
```

---

## 📋 Checklist Pré-Déploiement

### ✅ Complété
- [x] Code review terminée
- [x] Corrections appliquées
- [x] Tests passés (lint OK)
- [x] Migrations Prisma créées
- [x] Guide de déploiement créé

### ⏳ En Attente
- [ ] PR #1 approuvée et mergée
- [ ] Migrations appliquées sur staging DB
- [ ] Variables d'environnement configurées
- [ ] Services déployés

---

## 🚀 Commandes de Déploiement Staging

### 1. Appliquer Migrations Prisma

```bash
# Se connecter à la DB staging
cd apps/backend

# Vérifier status migrations
npx prisma migrate status

# Appliquer migrations
npx prisma migrate deploy

# Vérifier que ShopifyInstall table existe
npx prisma studio
# Ou via SQL direct
psql $DATABASE_URL -c "\d \"ShopifyInstall\""
```

### 2. Variables d'Environnement Requises

Voir `.github/DEPLOYMENT_STAGING_GUIDE.md` pour la liste complète.

**Minimum requis:**
- `DATABASE_URL` - Connection string PostgreSQL staging
- `JWT_SECRET` - Secret JWT (32+ caractères)
- `REDIS_URL` - URL Redis staging
- `SHOPIFY_API_KEY` - Clé API Shopify
- `SHOPIFY_API_SECRET` - Secret Shopify
- `MASTER_ENCRYPTION_KEY` - Clé encryption (32 chars hex)

### 3. Déployer Backend

```bash
# Via Docker Compose
docker-compose -f docker-compose.staging.yml up -d --build

# Ou via Vercel
cd apps/backend
vercel --prod --env=staging
```

### 4. Déployer Frontend

```bash
cd apps/frontend
vercel --prod --env=staging
```

### 5. Déployer Worker IA

```bash
cd apps/worker-ia
# Sur Railway/Render ou Docker
pnpm install
pnpm build
pnpm start
```

---

## 🧪 Smoke Tests

Une fois déployé, exécuter les tests :

```bash
# Health check
curl https://api-staging.luneo.app/health

# Test Shopify install endpoint
curl "https://api-staging.luneo.app/api/shopify/install?shop=test.myshopify.com&brandId=test"

# Test widget token
curl "https://api-staging.luneo.app/api/v1/embed/token?shop=test.myshopify.com"
```

---

## 📊 Monitoring

- **Logs**: Vérifier les logs des services
- **Métriques**: Prometheus/Grafana si configuré
- **Erreurs**: Sentry dashboard
- **Performance**: Temps de réponse < 200ms

---

**Une fois la PR mergée, suivre le guide complet: `.github/DEPLOYMENT_STAGING_GUIDE.md`**

