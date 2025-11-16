# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - Luneo

**Date:** 6 Novembre 2025  
**Plateforme recommandée:** Vercel (Frontend) + Railway/Render (Backend)

---

## 📋 **CHECKLIST PRÉ-DÉPLOIEMENT**

### ✅ **Configuration**
- [ ] Toutes les variables env configurées
- [ ] Stripe en mode production
- [ ] Database PostgreSQL production prête
- [ ] Redis production configuré
- [ ] S3 bucket production créé
- [ ] SendGrid vérifié et configuré
- [ ] Domain name configuré (luneo.app)

### ✅ **Sécurité**
- [ ] JWT secrets générés (32+ caractères)
- [ ] CORS configuré pour domaine prod uniquement
- [ ] Rate limiting vérifié
- [ ] SSL/HTTPS forcé
- [ ] Passwords backend hardcodés supprimés
- [ ] .env ajouté à .gitignore

### ✅ **Code**
- [ ] Build production réussit
- [ ] Type-check passe
- [ ] Lint check passe
- [ ] Tests E2E passent
- [ ] Bundle size < 300KB

### ✅ **Tests**
- [ ] Flow auth complet testé
- [ ] Stripe checkout testé
- [ ] Forgot password testé
- [ ] GDPR delete account testé
- [ ] Toutes les pages accessibles

---

## 🎯 **DÉPLOIEMENT VERCEL (Frontend)**

### **1. Installation Vercel CLI**

```bash
npm install -g vercel
```

### **2. Configuration Projet**

```bash
cd apps/frontend
vercel login
vercel link
```

### **3. Variables d'environnement**

```bash
# Ajouter dans Vercel Dashboard → Settings → Environment Variables

# Production
NEXT_PUBLIC_API_URL=https://api.luneo.app
NEXT_PUBLIC_APP_URL=https://app.luneo.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG.xxx
NEXTAUTH_SECRET=xxx
# ... (toutes les variables de .env.local)
```

### **4. Déploiement**

```bash
# Preview
vercel

# Production
vercel --prod
```

### **5. Configuration Domaine**

```bash
# Dans Vercel Dashboard:
# Settings → Domains → Add Domain
# Ajouter: app.luneo.app

# Configurer DNS:
# CNAME app → cname.vercel-dns.com
```

---

## 🗄️ **DÉPLOIEMENT BACKEND (Railway/Render)**

### **Option A: Railway**

```bash
# 1. Créer compte sur railway.app
# 2. Installer CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Deploy
cd apps/backend
railway init
railway up
```

**Variables env Railway:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://... (from Railway Postgres)
REDIS_URL=redis://... (from Railway Redis)
JWT_SECRET=xxx
STRIPE_SECRET_KEY=sk_live_xxx
# ... toutes les variables
```

### **Option B: Render**

1. Créer compte sur render.com
2. New → Web Service
3. Connecter repo GitHub
4. Build Command: `cd apps/backend && npm install && npm run build`
5. Start Command: `cd apps/backend && npm start`
6. Ajouter toutes les env vars

---

## 🗃️ **DATABASE PRODUCTION (Supabase)**

### **1. Créer projet Supabase**

```bash
# supabase.com → New Project
# Nom: luneo-production
# Region: eu-west-1 (Paris)
```

### **2. Récupérer URL**

```bash
# Settings → Database → Connection string
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

### **3. Migrations**

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma db seed
```

---

## 📧 **SENDGRID SETUP**

```bash
# 1. Créer compte sendgrid.com
# 2. Settings → API Keys → Create API Key
# 3. Vérifier domaine (luneo.app)
# 4. Créer templates email:
#    - forgot-password
#    - team-invite
#    - account-deleted
```

---

## 💳 **STRIPE PRODUCTION**

### **1. Activer mode Live**

```bash
# dashboard.stripe.com
# Developers → API Keys
# Copier les clés LIVE:
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **2. Webhooks**

```bash
# Developers → Webhooks → Add endpoint
URL: https://app.luneo.app/api/webhooks/stripe

Events:
- checkout.session.completed
- invoice.paid
- invoice.payment_failed
- customer.subscription.deleted
- customer.subscription.updated
```

### **3. Vérifier Price IDs**

```bash
# Les Price IDs changent entre test et live !
# Créer les produits en mode live:

# Professional - 29€/mois
stripe prices create \
  --unit-amount 2900 \
  --currency eur \
  --recurring[interval]=month \
  --product=prod_xxx

# Business - 59€/mois
# Enterprise - 99€/mois
```

---

## 🔐 **SÉCURITÉ PRODUCTION**

### **1. Générer secrets**

```bash
# JWT Secret (32 caractères minimum)
openssl rand -base64 32

# JWT Refresh Secret
openssl rand -base64 32

# NEXTAUTH Secret
openssl rand -base64 32
```

### **2. Configurer CORS**

```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: ['https://app.luneo.app'], // Uniquement domaine prod
  credentials: true,
});
```

### **3. Rate Limiting**

```bash
# Vérifier dans apps/backend:
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100 # Requêtes/minute
```

---

## 📊 **MONITORING**

### **Sentry (Error Tracking)**

```bash
# 1. Créer projet sentry.io
# 2. Ajouter DSN:
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# 3. Les erreurs seront automatiquement trackées
```

### **Vercel Analytics**

```typescript
// Déjà configuré dans layout.tsx
import { Analytics } from '@vercel/analytics/react';
<Analytics />
```

### **Uptime Monitoring**

```bash
# Utiliser:
# - UptimeRobot (gratuit)
# - Pingdom
# - Better Uptime

# Monitorer:
- https://app.luneo.app
- https://api.luneo.app/health
```

---

## 🧪 **TESTS PRÉ-DÉPLOIEMENT**

```bash
# 1. Build test
cd apps/frontend && npm run build

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Tests E2E
npm run test:e2e

# 5. Bundle analysis
npm run build:analyze

# 6. Lighthouse audit
npx lighthouse https://app.luneo.app --view
```

---

## 🚀 **PROCÉDURE DE DÉPLOIEMENT**

### **Première fois:**

```bash
# 1. Push to GitHub
git add .
git commit -m "feat: production ready"
git push origin main

# 2. Deploy frontend (Vercel)
cd apps/frontend
vercel --prod

# 3. Deploy backend (Railway)
cd apps/backend
railway up

# 4. Vérifier
curl https://api.luneo.app/health
curl https://app.luneo.app

# 5. Configurer Stripe webhooks
# Ajouter: https://app.luneo.app/api/webhooks/stripe

# 6. Tester flow complet
# Register → Login → Create Design → Checkout → Payment
```

### **Déploiements suivants:**

```bash
# Vercel auto-deploy sur git push
git push origin main

# Ou manuel:
vercel --prod
```

---

## 🔄 **CI/CD GitHub Actions**

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install
        run: cd apps/frontend && npm install
      
      - name: Type Check
        run: cd apps/frontend && npm run type-check
      
      - name: Lint
        run: cd apps/frontend && npm run lint
      
      - name: Build
        run: cd apps/frontend && npm run build
      
      - name: E2E Tests
        run: cd apps/frontend && npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📈 **POST-DÉPLOIEMENT**

### **Vérifications:**

```bash
# 1. Health checks
curl https://api.luneo.app/health
curl https://app.luneo.app/api/health

# 2. Test auth
curl -X POST https://api.luneo.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 3. Test Stripe
# Aller sur https://app.luneo.app/pricing
# Tester un checkout

# 4. Vérifier Sentry
# Aller sur sentry.io → Vérifier qu'il reçoit des events
```

### **Monitoring:**

```bash
# Configurer alertes:
# - Uptime < 99.9%
# - Error rate > 1%
# - Response time > 1s
# - CPU > 80%
# - Memory > 90%
```

---

## 🐛 **ROLLBACK SI PROBLÈME**

```bash
# Vercel: Retour version précédente
vercel rollback

# Railway: Redeploy commit précédent
railway rollback

# Ou dans dashboard:
# Vercel → Deployments → Previous → Promote to Production
```

---

## ✅ **CHECKLIST FINALE**

- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Railway/Render
- [ ] Database Supabase configurée
- [ ] Redis configuré
- [ ] Stripe webhooks configurés
- [ ] Domain luneo.app pointé
- [ ] SSL/HTTPS activé
- [ ] Sentry configuré
- [ ] Uptime monitoring activé
- [ ] Health checks OK
- [ ] Flow complet testé en prod

---

**Status:** Prêt pour le déploiement 🚀



