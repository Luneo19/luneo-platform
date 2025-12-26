# 🚀 Déploiement Production - Maintenant

**Date:** Décembre 2024  
**Status:** 🚀 **DÉPLOIEMENT EN COURS**

---

## ✅ Vérifications Pré-Déploiement

### 1. Variables d'Environnement Vercel

#### À Vérifier
- [ ] Aller sur [vercel.com](https://vercel.com)
- [ ] Sélectionner le projet
- [ ] Settings > Environment Variables
- [ ] Vérifier toutes les variables obligatoires

#### Variables Obligatoires
```bash
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SENTRY_DSN
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
DATABASE_URL
NODE_ENV=production
```

### 2. Secrets GitHub

#### À Vérifier
- [ ] Aller sur GitHub
- [ ] Settings > Secrets and variables > Actions
- [ ] Vérifier secrets nécessaires

#### Secrets Obligatoires
```bash
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SLACK_WEBHOOK_URL (optionnel)
```

### 3. Code

#### À Vérifier
- [ ] Tous les changements commités
- [ ] Tests passent
- [ ] Build réussi
- [ ] Sur la branche `main`

---

## 🚀 Déploiement

### Option 1: Automatique (Recommandé)

#### Étapes
1. **S'assurer d'être sur `main`**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Push vers `main`**
   ```bash
   git push origin main
   ```

3. **CI/CD s'exécute automatiquement**
   - Tests
   - Build
   - Déploiement production

4. **Vérifier déploiement**
   - GitHub Actions: https://github.com/[org]/[repo]/actions
   - Vercel Dashboard: https://vercel.com/dashboard
   - Application: https://app.luneo.app

### Option 2: Manuel via Vercel CLI

#### Étapes
1. **Installer Vercel CLI** (si pas déjà fait)
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Déploiement production**
   ```bash
   cd apps/frontend
   vercel --prod
   ```

4. **Vérifier déploiement**
   - Vercel Dashboard
   - Application: https://app.luneo.app

---

## ✅ Vérifications Post-Déploiement

### Immédiat (0-5 min)
- [ ] Health check: `curl https://app.luneo.app/api/health`
- [ ] Application accessible: https://app.luneo.app
- [ ] Aucune erreur console

### Court Terme (5-15 min)
- [ ] Sentry vérifié (pas d'erreurs critiques)
- [ ] Vercel Analytics vérifié
- [ ] Fonctionnalités critiques testées:
  - [ ] Authentification
  - [ ] Dashboard
  - [ ] AI Studio
  - [ ] Checkout Stripe

### Moyen Terme (15-30 min)
- [ ] Performance acceptable
- [ ] Core Web Vitals OK
- [ ] Monitoring actif
- [ ] Aucune erreur critique

---

## 🚨 En Cas de Problème

### Application Non Accessible
1. Vérifier Vercel Dashboard
2. Vérifier logs
3. Vérifier health checks
4. Consulter [docs/ROLLBACK_GUIDE.md](docs/ROLLBACK_GUIDE.md)

### Erreurs Runtime
1. Vérifier Sentry
2. Vérifier variables d'environnement
3. Vérifier logs Vercel

### Rollback
1. Consulter [docs/ROLLBACK_GUIDE.md](docs/ROLLBACK_GUIDE.md)
2. Via Vercel Dashboard: Deployments > Previous > Promote to Production

---

## 📋 Checklist Complète

### Avant
- [ ] Variables Vercel configurées
- [ ] Secrets GitHub configurés
- [ ] Code sur `main`
- [ ] Tests passent
- [ ] Build réussi

### Pendant
- [ ] Déploiement lancé
- [ ] CI/CD s'exécute
- [ ] Health checks OK

### Après
- [ ] Application accessible
- [ ] Fonctionnalités OK
- [ ] Performance OK
- [ ] Monitoring actif

---

**Status:** 🚀 **PRÊT POUR DÉPLOIEMENT**

