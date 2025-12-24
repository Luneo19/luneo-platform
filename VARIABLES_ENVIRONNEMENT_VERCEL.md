# 🔐 VARIABLES D'ENVIRONNEMENT VERCEL - FRONTEND

## Variables OBLIGATOIRES

Ces variables doivent être configurées dans Vercel pour que l'application fonctionne :

```env
# API Configuration (OBLIGATOIRE)
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app

# Authentication - Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Variables RECOMMANDÉES

```env
# Stripe (si utilisé pour paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...  # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...  # Server-side only

# OAuth (optionnel)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id

# Cloudinary (optionnel)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...

# Feature Flags (optionnel)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=false
NEXT_PUBLIC_ENABLE_AI_STUDIO=true
```

## Comment configurer dans Vercel

### Via Dashboard

1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner votre projet frontend
3. Settings → Environment Variables
4. Ajouter chaque variable avec sa valeur
5. Sélectionner les environnements (Production, Preview, Development)

### Via CLI

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Entrer la valeur: https://your-railway-backend.up.railway.app/api

vercel env add NEXT_PUBLIC_APP_URL production
# Entrer la valeur: https://app.luneo.app

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Entrer la valeur: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Entrer la valeur: your-supabase-anon-key
```

## Configuration Root Directory

**IMPORTANT**: Dans Vercel Settings → General, configurer :
- **Root Directory**: `apps/frontend`

## Validation

Après avoir configuré les variables, redéployer :

```bash
vercel --prod
```

Vérifier que le build réussit et que l'application fonctionne.
