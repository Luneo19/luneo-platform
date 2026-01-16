# 🚀 Guide de Déploiement Complet - Luneo Platform

**Date**: Décembre 2024  
**Version**: 2.0.0

---

## 📋 Vue d'ensemble

Ce guide couvre le déploiement complet de la plateforme Luneo :
- **Frontend** : Vercel (Next.js 15)
- **Backend** : Railway (NestJS + PostgreSQL + Redis)

---

## 🎯 Prérequis

### 1. Comptes requis
- ✅ Compte Vercel (https://vercel.com)
- ✅ Compte Railway (https://railway.app)
- ✅ Compte GitHub (pour le repository)

### 2. Outils CLI
```bash
# Vercel CLI
npm install -g vercel

# Railway CLI
npm install -g @railway/cli

# Vérification
vercel --version
railway --version
```

---

## 🌐 PARTIE 1 : DÉPLOIEMENT FRONTEND (Vercel)

### Étape 1 : Connexion Vercel

```bash
cd apps/frontend
vercel login
```

### Étape 2 : Configuration du projet

1. **Créer un nouveau projet Vercel** (si pas déjà fait) :
   ```bash
   vercel
   ```
   - Suivre les instructions interactives
   - **IMPORTANT** : Root Directory = `apps/frontend`

2. **Ou lier à un projet existant** :
   ```bash
   vercel link
   ```

### Étape 3 : Configurer Root Directory

**Via Dashboard Vercel** :
1. Aller sur : https://vercel.com/dashboard
2. Sélectionner votre projet
3. Settings → General → Root Directory
4. Entrer : `apps/frontend`
5. Save

**Via API** (automatique) :
```bash
cd apps/frontend
./scripts/configure-vercel-root-directory.sh
```

### Étape 4 : Variables d'environnement Vercel

**Via Dashboard** :
1. Settings → Environment Variables
2. Ajouter les variables suivantes :

```env
# Supabase (si utilisé)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Backend API
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app/api

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx...

# App
NEXT_PUBLIC_APP_URL=https://app.luneo.app
NODE_ENV=production

# Sentry (optionnel)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Via CLI** :
```bash
cd apps/frontend
vercel env add NEXT_PUBLIC_API_URL production
# Entrer la valeur : https://votre-backend.railway.app/api
```

### Étape 5 : Déploiement

```bash
cd apps/frontend
vercel --prod
```

**Ou via script** :
```bash
cd apps/frontend
./scripts/deploy-vercel.sh
```

### Étape 6 : Vérification

1. Vérifier l'URL de déploiement dans le dashboard Vercel
2. Tester : `https://votre-projet.vercel.app`
3. Vérifier les logs : `vercel logs`

---

## 🚂 PARTIE 2 : DÉPLOIEMENT BACKEND (Railway)

### Étape 1 : Connexion Railway

```bash
railway login
```

### Étape 2 : Créer/Lier le projet

```bash
cd apps/backend

# Si nouveau projet
railway init

# Si projet existant
railway link -p <PROJECT_ID>
```

### Étape 3 : Ajouter PostgreSQL

**Via Dashboard** :
1. Ouvrir Railway Dashboard : https://railway.app
2. Cliquer sur "+ New"
3. Sélectionner "Database" → "PostgreSQL"
4. Railway génère automatiquement `DATABASE_URL`

**Via CLI** :
```bash
railway add postgresql
```

### Étape 4 : Ajouter Redis (optionnel mais recommandé)

**Via Dashboard** :
1. "+ New" → "Database" → "Redis"

**Via CLI** :
```bash
railway add redis
```

### Étape 5 : Configurer Root Directory

**Via Dashboard** :
1. Settings → Root Directory
2. Entrer : `apps/backend`
3. Save

### Étape 6 : Variables d'environnement Railway

**Variables OBLIGATOIRES** (via Dashboard Railway) :

```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (si ajouté)
REDIS_URL=${{Redis.REDIS_URL}}

# Node
NODE_ENV=production
PORT=3001

# JWT (générer avec: openssl rand -base64 32)
JWT_SECRET=<générer-un-secret-32-chars>
JWT_REFRESH_SECRET=<générer-un-secret-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PREFIX=/api
FRONTEND_URL=https://app.luneo.app
CORS_ORIGIN=https://app.luneo.app,https://luneo.app

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx...
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
SENDGRID_REPLY_TO=support@luneo.app

# AI Providers
OPENAI_API_KEY=sk-xxx...

# Cloudinary (si utilisé)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

**Via CLI** (pour les variables simples) :
```bash
cd apps/backend
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
```

**⚠️ IMPORTANT** : Pour `DATABASE_URL` et `REDIS_URL`, utiliser la syntaxe Railway :
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `REDIS_URL=${{Redis.REDIS_URL}}`

Ces références doivent être configurées **via le Dashboard Railway**, pas via CLI.

### Étape 7 : Migrations Prisma

**Avant le premier déploiement** :
```bash
cd apps/backend
railway run "pnpm prisma migrate deploy"
```

**Ou via Dashboard** :
1. Railway Dashboard → Service Backend
2. Deployments → New Deployment
3. Run Command : `cd apps/backend && pnpm prisma migrate deploy`

### Étape 8 : Déploiement

**Via Git (automatique)** :
1. Push sur la branche `main` ou `develop`
2. Railway détecte automatiquement et déploie

**Via CLI** :
```bash
cd apps/backend
railway up
```

### Étape 9 : Vérification

1. **Vérifier les logs** :
   ```bash
   railway logs
   ```

2. **Vérifier le health check** :
   ```bash
   curl https://votre-backend.railway.app/api/health
   ```

3. **Vérifier dans Railway Dashboard** :
   - Deployments → Voir le dernier déploiement
   - Metrics → Vérifier CPU, Memory, Network

---

## 🔗 PARTIE 3 : CONFIGURATION CROSS-PLATFORM

### 1. Lier Frontend ↔ Backend

**Dans Vercel** (Frontend) :
```env
NEXT_PUBLIC_API_URL=https://votre-backend.railway.app/api
```

**Dans Railway** (Backend) :
```env
FRONTEND_URL=https://app.luneo.app
CORS_ORIGIN=https://app.luneo.app,https://luneo.app
```

### 2. Webhooks Stripe

**Dans Stripe Dashboard** :
1. Developers → Webhooks
2. Add endpoint
3. URL : `https://votre-backend.railway.app/api/webhooks/stripe`
4. Events : Sélectionner tous les événements nécessaires
5. Copier le `webhook secret`

**Dans Railway** :
```env
STRIPE_WEBHOOK_SECRET=whsec_xxx...
```

### 3. Domaines personnalisés

**Vercel** :
1. Settings → Domains
2. Add Domain
3. Suivre les instructions DNS

**Railway** :
1. Settings → Networking
2. Generate Domain
3. Ou ajouter un domaine personnalisé

---

## ✅ Checklist de Déploiement

### Frontend (Vercel)
- [ ] Vercel CLI installé et connecté
- [ ] Projet créé/lié
- [ ] Root Directory configuré : `apps/frontend`
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Déploiement en production
- [ ] URL accessible
- [ ] Health check OK

### Backend (Railway)
- [ ] Railway CLI installé et connecté
- [ ] Projet créé/lié
- [ ] PostgreSQL ajouté
- [ ] Redis ajouté (optionnel)
- [ ] Root Directory configuré : `apps/backend`
- [ ] Variables d'environnement configurées
- [ ] Migrations Prisma exécutées
- [ ] Build réussi
- [ ] Déploiement en production
- [ ] Health check OK : `/api/health`
- [ ] Logs sans erreurs

### Cross-Platform
- [ ] Frontend pointe vers Backend (`NEXT_PUBLIC_API_URL`)
- [ ] Backend autorise Frontend (`CORS_ORIGIN`)
- [ ] Webhooks Stripe configurés
- [ ] Domaines personnalisés configurés (si applicable)

---

## 🐛 Dépannage

### Frontend (Vercel)

**Erreur : "No Next.js version detected"**
- Vérifier Root Directory = `apps/frontend`
- Vérifier que `package.json` contient `"next"`

**Erreur : Build failed**
- Vérifier les logs : `vercel logs`
- Vérifier les variables d'environnement
- Tester le build local : `cd apps/frontend && npm run build`

### Backend (Railway)

**Erreur : "Cannot connect to database"**
- Vérifier `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- Vérifier que PostgreSQL est démarré
- Vérifier les migrations : `railway run "pnpm prisma migrate deploy"`

**Erreur : "Port already in use"**
- Railway fournit automatiquement `$PORT`
- Vérifier que l'app utilise `process.env.PORT`

**Erreur : Build failed**
- Vérifier les logs : `railway logs`
- Vérifier `nixpacks.toml` ou `railway.toml`
- Vérifier Root Directory = `apps/backend`

---

## 📚 Ressources

- **Vercel Docs** : https://vercel.com/docs
- **Railway Docs** : https://docs.railway.app
- **Prisma Migrate** : https://www.prisma.io/docs/guides/migrate
- **Next.js Deployment** : https://nextjs.org/docs/deployment

---

## 🚀 Scripts de Déploiement Rapide

### Frontend
```bash
cd apps/frontend
./scripts/deploy-vercel.sh
```

### Backend
```bash
cd apps/backend
railway up
```

---

**Status** : ✅ Prêt pour déploiement  
**Dernière mise à jour** : Décembre 2024
