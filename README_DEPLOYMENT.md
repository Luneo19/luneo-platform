# 🚀 Guide de Déploiement - Luneo Platform

## ⚡ Déploiement Rapide

### Option 1 : Script automatique (recommandé)

```bash
./scripts/deploy-production.sh
```

### Option 2 : Script rapide interactif

```bash
./QUICK_DEPLOY.sh
```

### Option 3 : Déploiement séparé

**Frontend uniquement** :
```bash
./scripts/deploy-vercel-frontend.sh
```

**Backend uniquement** :
```bash
./scripts/deploy-railway-backend.sh
```

---

## 📋 Prérequis

1. **Comptes** :
   - ✅ Vercel : https://vercel.com
   - ✅ Railway : https://railway.app

2. **CLI installés** :
   ```bash
   npm install -g vercel @railway/cli
   ```

3. **Connexions** :
   ```bash
   vercel login
   railway login
   ```

---

## 🌐 Frontend (Vercel)

### Configuration

1. **Root Directory** : `apps/frontend` (via Dashboard Vercel)
2. **Variables d'environnement** : Voir `DEPLOYMENT_GUIDE.md`

### Déploiement

```bash
cd apps/frontend
vercel --prod
```

---

## 🚂 Backend (Railway)

### Configuration

1. **Root Directory** : `apps/backend` (via Dashboard Railway)
2. **PostgreSQL** : Ajouter via Dashboard
3. **Variables d'environnement** : Voir `DEPLOYMENT_GUIDE.md`

### Déploiement

```bash
cd apps/backend
railway run "pnpm prisma migrate deploy"
railway up
```

---

## 📚 Documentation Complète

- **Guide complet** : `DEPLOYMENT_GUIDE.md`
- **Checklist** : `DEPLOYMENT_CHECKLIST.md`
- **Déploiement rapide** : `DEPLOY_NOW.md`

---

**Status** : ✅ Prêt pour déploiement
