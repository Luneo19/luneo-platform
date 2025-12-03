# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION - LUNEO

**Date:** 30 Novembre 2025  
**Version:** 1.0.0

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### ✅ Code Ready
- [x] 315 tests passent
- [x] Pas d'erreurs TypeScript
- [x] Security middleware configuré
- [x] Error boundaries en place
- [x] Sentry intégré

### 📦 Services à configurer
- [ ] Supabase (Database)
- [ ] Stripe (Payments)
- [ ] Vercel (Hosting)
- [ ] Sentry (Monitoring)
- [ ] Upstash Redis (Cache)
- [ ] Cloudinary (Images)
- [ ] Resend (Emails)

---

## 1️⃣ VARIABLES D'ENVIRONNEMENT

### Dans Vercel Dashboard → Settings → Environment Variables

```env
# ===== APPLICATION =====
NEXT_PUBLIC_APP_URL=https://luneo.app
NEXT_PUBLIC_APP_NAME=Luneo
NODE_ENV=production

# ===== SUPABASE =====
# Dashboard: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# ===== STRIPE (MODE LIVE) =====
# Dashboard: https://dashboard.stripe.com/apikeys
# ⚠️ IMPORTANT: Utiliser pk_live_ et sk_live_ (PAS test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Prix IDs (créer dans Stripe Dashboard > Products)
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxx
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx

# ===== SENTRY =====
# Dashboard: https://sentry.io/settings/
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=luneo
SENTRY_PROJECT=luneo-frontend

# ===== UPSTASH REDIS =====
# Dashboard: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# ===== CLOUDINARY =====
# Dashboard: https://cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=luneo
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# ===== RESEND =====
# Dashboard: https://resend.com/api-keys
RESEND_API_KEY=re_xxx

# ===== LIVEBLOCKS =====
# Dashboard: https://liveblocks.io/dashboard
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_xxx
LIVEBLOCKS_SECRET_KEY=sk_xxx

# ===== ANALYTICS =====
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-xxx

# ===== CRISP CHAT =====
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxx

# ===== AI SERVICES =====
REPLICATE_API_TOKEN=r8_xxx
OPENAI_API_KEY=sk-xxx

# ===== SECURITY =====
# Générer: openssl rand -base64 32
NEXTAUTH_SECRET=xxx
CSRF_SECRET=xxx
```

---

## 2️⃣ DÉPLOIEMENT VERCEL

### Option A: Via GitHub (Recommandé)

1. **Connecter le repo GitHub à Vercel**
   ```
   https://vercel.com/new
   → Import Git Repository
   → Sélectionner luneo-platform
   ```

2. **Configurer le projet**
   - Framework: Next.js
   - Root Directory: `apps/frontend`
   - Build Command: `pnpm run build`
   - Output Directory: `.next`

3. **Ajouter les variables d'environnement**
   - Coller toutes les variables ci-dessus
   - Sélectionner: Production, Preview, Development

4. **Deploy !**

### Option B: Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer (depuis apps/frontend)
cd apps/frontend
vercel --prod
```

### Configuration vercel.json

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 3️⃣ CONFIGURATION STRIPE LIVE

### Étapes dans Stripe Dashboard

1. **Activer le mode Live**
   - Dashboard → Toggle "Test mode" → OFF

2. **Créer les produits et prix**
   ```
   Products → Add Product
   
   Starter - 29€/mois | 278.40€/an
   Professional - 49€/mois | 470.40€/an  
   Business - 99€/mois | 950.40€/an
   ```

3. **Configurer le webhook**
   ```
   Developers → Webhooks → Add endpoint
   URL: https://luneo.app/api/stripe/webhook
   Events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

4. **Copier le Webhook Secret** → `STRIPE_WEBHOOK_SECRET`

5. **Activer Stripe Connect** (pour marketplace)
   ```
   Connect → Get started
   Platform type: Standard
   ```

---

## 4️⃣ CONFIGURATION SENTRY

### Étapes

1. **Créer le projet Sentry**
   ```
   https://sentry.io/
   → Create Project
   → Platform: Next.js
   ```

2. **Installer et configurer**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Fichier sentry.client.config.ts**
   ```typescript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   ```

4. **Configurer les alertes**
   - Alerts → Create Alert Rule
   - Conditions: Error count > 10 in 1 hour
   - Actions: Email + Slack

---

## 5️⃣ CONFIGURATION DNS

### Pour luneo.app

1. **Dans Vercel**
   - Settings → Domains → Add Domain
   - `luneo.app` et `www.luneo.app`

2. **Dans votre registrar DNS**
   ```
   Type    Name    Value
   A       @       76.76.21.21
   CNAME   www     cname.vercel-dns.com
   ```

3. **SSL automatique** ✅ (Vercel s'en charge)

---

## 6️⃣ CHECKLIST LANCEMENT BETA

### Avant le lancement

- [ ] Toutes les variables d'environnement configurées
- [ ] Stripe en mode LIVE
- [ ] Webhook Stripe testé
- [ ] Sentry alertes configurées
- [ ] DNS propagé (vérifier avec `dig luneo.app`)
- [ ] SSL actif (https fonctionne)
- [ ] Pages légales à jour (CGV, CGU, Privacy)
- [ ] Email de bienvenue testé
- [ ] Backup Supabase activé

### Tests manuels

- [ ] Inscription utilisateur
- [ ] Connexion OAuth (Google, GitHub)
- [ ] Création de design
- [ ] Souscription Stripe (avec vraie carte test)
- [ ] Export GDPR
- [ ] Contact form

### Monitoring actif

- [ ] Sentry reçoit les erreurs
- [ ] Vercel Analytics actif
- [ ] Google Analytics configuré
- [ ] UptimeRobot/Pingdom configuré

---

## 7️⃣ COMMANDES UTILES

```bash
# Build local
pnpm run build

# Vérifier les types
pnpm run typecheck

# Lancer les tests
pnpm run test

# Preview production
pnpm run start

# Logs Vercel
vercel logs --follow

# Rollback si problème
vercel rollback
```

---

## 📞 SUPPORT

En cas de problème:
- Vercel Status: https://www.vercel-status.com/
- Stripe Status: https://status.stripe.com/
- Supabase Status: https://status.supabase.com/
- Sentry Status: https://status.sentry.io/

---

**Bonne chance pour le lancement ! 🚀**

