# 🚀 QUICK START - FINALISATION PRODUCTION

**Temps estimé** : 30-60 minutes

---

## ✅ ÉTAPE 1 : Configuration Frontend Vercel (15 min)

### 1.1 Ouvrir Vercel Dashboard

1. Aller sur https://vercel.com
2. Ouvrir le projet `frontend` (ou `luneo-platform`)
3. Settings → Environment Variables

### 1.2 Ajouter les Variables

**Copier-coller ces variables** :

```env
# API Backend (CRITIQUE)
NEXT_PUBLIC_API_URL=https://api.luneo.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app

# Supabase (si pas déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-clé>

# Stripe (si pas déjà configuré)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<votre-clé>
NEXT_PUBLIC_STRIPE_SUCCESS_URL=https://app.luneo.app/?success=1
NEXT_PUBLIC_STRIPE_CANCEL_URL=https://app.luneo.app/?canceled=1

# Secrets (Server-side)
STRIPE_SECRET_KEY=sk_live_<votre-clé>
STRIPE_WEBHOOK_SECRET=whsec_<votre-secret>
```

**Important** : Remplacer `<votre-clé>` par les vraies valeurs.

### 1.3 Redéployer

```bash
cd apps/frontend
vercel --prod
```

---

## ✅ ÉTAPE 2 : Vérifier DNS (5 min)

### Dans Cloudflare

Vérifier que :
- ✅ `app.luneo.app` → Vercel (76.76.21.21)
- ✅ `api.luneo.app` → Railway (déjà configuré ✅)

---

## ✅ ÉTAPE 3 : Configurer Intégrations Backend (10 min)

### Dans Railway Dashboard

**Variables à ajouter** (si pas déjà fait) :

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_<votre-clé>
STRIPE_WEBHOOK_SECRET=whsec_<votre-secret>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<votre-cloud-name>
CLOUDINARY_API_KEY=<votre-clé>
CLOUDINARY_API_SECRET=<votre-secret>

# SendGrid
SENDGRID_API_KEY=SG.<votre-clé>

# OpenAI
OPENAI_API_KEY=sk-<votre-clé>
```

**Commandes** :
```bash
cd apps/backend
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set CLOUDINARY_CLOUD_NAME="..."
# etc.
```

---

## ✅ ÉTAPE 4 : Tests Finaux (10 min)

### 4.1 Backend

```bash
# Health check
curl https://api.luneo.app/api/health

# Devrait retourner : {"success":true,"data":{"status":"ok"}}
```

### 4.2 Frontend

1. Ouvrir https://app.luneo.app
2. Vérifier que la page se charge
3. Tester le login
4. Vérifier que les appels API fonctionnent

### 4.3 Intégration

```bash
# Depuis le navigateur (console)
fetch('https://api.luneo.app/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## ✅ ÉTAPE 5 : Monitoring (Optionnel - 10 min)

### Sentry

**Backend (Railway)** :
```bash
railway variables set SENTRY_DSN="https://..."
railway variables set SENTRY_ENVIRONMENT="production"
```

**Frontend (Vercel)** :
```env
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

## 🎯 CHECKLIST RAPIDE

- [ ] Variables Vercel configurées
- [ ] Frontend redéployé
- [ ] DNS vérifié
- [ ] Variables Railway configurées (Stripe, Cloudinary, etc.)
- [ ] Health check backend OK
- [ ] Frontend accessible
- [ ] Login fonctionne
- [ ] API calls fonctionnent

---

## 🚨 EN CAS DE PROBLÈME

### Frontend ne se connecte pas au Backend

1. Vérifier `NEXT_PUBLIC_API_URL` dans Vercel
2. Vérifier CORS dans Railway
3. Vérifier les logs Vercel : `vercel logs`

### Backend ne répond pas

1. Vérifier les logs : `railway logs`
2. Vérifier health check : `curl https://api.luneo.app/api/health`
3. Vérifier les variables d'environnement : `railway variables`

---

## 🎉 C'EST TOUT !

Une fois ces 5 étapes complétées, votre plateforme est **100% prête pour la production** !

**FÉLICITATIONS ! 🚀**








