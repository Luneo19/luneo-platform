# 🚀 Guide de Déploiement Production - Luneo Platform

**Date:** Décembre 2024  
**Status:** Guide complet de déploiement

---

## 🎯 Vue d'Ensemble

Ce guide détaille le processus complet de déploiement en production pour Luneo Platform.

---

## 📋 Pré-requis

### 1. Comptes et Services

#### Requis
- ✅ **Vercel** - Déploiement frontend
- ✅ **Railway/Hetzner** - Déploiement backend (si applicable)
- ✅ **Supabase** - Base de données et auth
- ✅ **Stripe** - Paiements
- ✅ **Sentry** - Error tracking
- ✅ **Upstash** - Redis
- ✅ **Cloudinary** - Stockage images
- ✅ **OpenAI** - Génération IA

### 2. Variables d'Environnement

#### Frontend (Vercel)

**Obligatoires:**
```bash
NEXT_PUBLIC_APP_URL=https://luneo.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
OPENAI_API_KEY=sk-xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
DATABASE_URL=postgresql://xxx
NODE_ENV=production
```

**Optionnelles:**
```bash
NEXT_PUBLIC_VERCEL_ENV=production
ANALYZE=false
```

---

## 🔍 Vérifications Pré-Déploiement

### 1. Code Quality

#### Tests
```bash
cd apps/frontend
npm run test
```

#### Build
```bash
npm run build
```

#### Linting
```bash
npm run lint
```

### 2. Sécurité

#### Security Audit
- ✅ Score: 93/100
- ✅ CSP avec nonces
- ✅ Rate limiting activé
- ✅ CSRF protection

#### Variables d'Environnement
- [ ] Toutes les variables configurées
- [ ] Secrets sécurisés
- [ ] Pas de secrets dans le code

### 3. Database

#### Migrations
```bash
cd apps/frontend
npx prisma migrate deploy
```

#### Vérification
```bash
npx prisma db pull
npx prisma generate
```

---

## 🚀 Déploiement

### Option 1: Déploiement Automatique (CI/CD)

#### Via GitHub Actions
1. Push sur `main` branch
2. CI/CD pipeline s'exécute automatiquement
3. Tests et build
4. Déploiement staging automatique
5. Déploiement production après validation

#### Configuration
- **Fichier:** `.github/workflows/ci.yml`
- **Staging:** Déploiement automatique
- **Production:** Déploiement après validation

### Option 2: Déploiement Manuel

#### Via Vercel CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déploiement
cd apps/frontend
vercel --prod
```

#### Via Vercel Dashboard
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner le projet
3. Aller dans "Deployments"
4. Cliquer sur "Deploy" ou promouvoir un déploiement

---

## 📊 Post-Déploiement

### Vérifications Immédiates

#### 1. Health Checks
```bash
# Frontend
curl https://luneo.app/api/health

# Backend (si applicable)
curl https://api.luneo.app/health
```

#### 2. Application
- [ ] Application accessible
- [ ] Pages principales chargent
- [ ] Pas d'erreurs console
- [ ] Performance acceptable

#### 3. Fonctionnalités Critiques
- [ ] Authentification fonctionne
- [ ] Dashboard accessible
- [ ] AI Studio fonctionne
- [ ] Checkout Stripe fonctionne
- [ ] API endpoints fonctionnent

### Monitoring

#### Sentry
- Vérifier dashboard Sentry
- Aucune erreur critique
- Performance acceptable

#### Vercel Analytics
- Vérifier métriques
- Core Web Vitals acceptables
- Pas de régression performance

#### Logs
- Vérifier logs Vercel
- Aucune erreur critique
- Performance acceptable

---

## 🔄 Rollback

### Processus de Rollback

#### Via Vercel Dashboard
1. Aller dans "Deployments"
2. Sélectionner version précédente stable
3. Cliquer sur "Promote to Production"
4. Confirmer

#### Via Vercel CLI
```bash
vercel rollback
```

#### Vérifications Après Rollback
- [ ] Application accessible
- [ ] Fonctionnalités critiques OK
- [ ] Aucune erreur critique
- [ ] Performance acceptable

---

## 🚨 Troubleshooting

### Problèmes Courants

#### Build Failed
- Vérifier variables d'environnement
- Vérifier logs de build
- Vérifier dépendances

#### Application Non Accessible
- Vérifier DNS
- Vérifier SSL/TLS
- Vérifier health checks

#### Erreurs Runtime
- Vérifier Sentry
- Vérifier logs
- Vérifier variables d'environnement

---

## 📝 Checklist Complète

Voir **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** pour checklist détaillée.

---

## 🎯 Best Practices

### 1. Déploiement Progressif
- Toujours déployer staging d'abord
- Tester staging avant production
- Déployer production après validation

### 2. Monitoring
- Surveiller Sentry après déploiement
- Vérifier performance
- Réagir rapidement aux erreurs

### 3. Documentation
- Documenter changements
- Mettre à jour changelog
- Communiquer changements

---

**Dernière mise à jour:** Décembre 2024









