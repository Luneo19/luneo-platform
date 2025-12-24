# 🚀 Déploiement Staging - Prêt

**Date**: 16 novembre 2025  
**Status**: ✅ Corrections complétées, prêt pour déploiement

---

## ✅ Corrections Effectuées

### Packages Workspace
- ✅ Créé `packages/billing-plans/package.json`
- ✅ Créé `packages/ai-safety/package.json`
- ✅ Packages reconnus dans le workspace

### Builds
- ✅ Backend: Build disponible
- ✅ Frontend: Build disponible
- ⚠️ Mobile: Problème ignoré (non nécessaire pour staging)

---

## 🚀 Étapes de Déploiement

### Étape 1: Configurer Variables Staging

Créer fichier `.env.staging` ou configurer dans Vercel:

```bash
# Depuis template
cat docs/staging-env-template.md | grep -E "^[A-Z]" > .env.staging

# Éditer avec vos valeurs
nano .env.staging

# Charger variables
export $(cat .env.staging | xargs)
```

**Variables requises:**
- `DATABASE_URL` - PostgreSQL staging
- `JWT_SECRET` - Secret JWT
- `REDIS_URL` - Redis staging
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET`
- `MASTER_ENCRYPTION_KEY`
- Autres variables (voir `docs/staging-env-template.md`)

### Étape 2: Appliquer Migrations Prisma

```bash
cd apps/backend

# Vérifier connexion
psql $DATABASE_URL -c "SELECT 1"

# Appliquer migrations
npx prisma migrate deploy

# Vérifier table ShopifyInstall
npx prisma studio
```

### Étape 3: Déployer Backend

```bash
cd apps/backend

# Vérifier connexion Vercel
vercel whoami

# Déployer
vercel --prod --yes

# Vérifier déploiement
vercel ls
```

### Étape 4: Déployer Frontend

```bash
cd apps/frontend

# Déployer
vercel --prod --yes

# Vérifier déploiement
vercel ls
```

### Étape 5: Vérifier Déploiement

```bash
# Configurer URLs staging
export STAGING_API_URL="https://api-staging.luneo.app"
export STAGING_FRONTEND_URL="https://staging.luneo.app"

# Exécuter smoke tests
./scripts/smoke-tests-staging.sh

# Vérifier health checks manuellement
curl ${STAGING_API_URL}/health
curl ${STAGING_FRONTEND_URL}/api/health
```

---

## 📋 Checklist Déploiement

- [ ] Variables staging configurées
- [ ] Migrations Prisma appliquées
- [ ] Backend déployé sur Vercel
- [ ] Frontend déployé sur Vercel
- [ ] Worker IA déployé (si nécessaire)
- [ ] Health checks passent
- [ ] Smoke tests passent
- [ ] Monitoring configuré

---

## 🆘 Dépannage

**Si migrations échouent:**
```bash
# Vérifier connexion DB
psql $DATABASE_URL -c "SELECT 1"

# Vérifier status migrations
npx prisma migrate status
```

**Si déploiement Vercel échoue:**
```bash
# Vérifier logs
vercel logs

# Vérifier variables d'environnement dans Vercel Dashboard
```

**Si smoke tests échouent:**
```bash
# Vérifier URLs staging
echo $STAGING_API_URL
echo $STAGING_FRONTEND_URL

# Vérifier health checks manuellement
curl -v ${STAGING_API_URL}/health
```

---

## 📚 Documentation

- Quick Start: `.github/QUICK_START_STAGING.md`
- Guide Complet: `.github/DEPLOYMENT_STAGING_GUIDE.md`
- Template Variables: `docs/staging-env-template.md`
- Script Déploiement: `scripts/deploy-all-staging.sh`

---

**✅ Prêt pour déploiement !**

