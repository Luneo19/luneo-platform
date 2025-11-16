# 🔐 VARIABLES D'ENVIRONNEMENT VERCEL - LISTE COMPLÈTE

**Date**: Novembre 2025  
**Projet**: Luneo Platform Frontend  
**URL Configuration**: https://vercel.com/dashboard → Settings → Environment Variables

---

## 📋 INSTRUCTIONS

1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet
3. **Settings** → **Environment Variables**
4. Pour chaque variable ci-dessous:
   - Si elle existe: **Edit** → Remplacer la valeur
   - Si elle n'existe pas: **Add New** → Ajouter
   - **Environments**: Sélectionner **"Production, Preview, and Development"**
   - Cliquer **"Save"**

---

## 🔴 VARIABLES CRITIQUES (OBLIGATOIRES)

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
```

**Où trouver**: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/settings/api

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8
```

**Où trouver**: Supabase Dashboard → Settings → API → "anon public" key

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE
```

**Où trouver**: Supabase Dashboard → Settings → API → "service_role" key

### Application

```bash
NEXT_PUBLIC_API_URL=https://app.luneo.app/api
```

```bash
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

### OAuth Google

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
```

```bash
GOOGLE_CLIENT_SECRET=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
```

**Où trouver**: https://console.cloud.google.com/apis/credentials

### OAuth GitHub

```bash
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi
```

```bash
GITHUB_CLIENT_SECRET=81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
```

**Où trouver**: https://github.com/settings/developers

### Stripe

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51DzUAlKG9MsM6fdScqo3...
```

```bash
STRIPE_SECRET_KEY=sk_live_51DzUAlKG9MsM6fdScqo3...
```

```bash
STRIPE_WEBHOOK_SECRET=whsec_rgKvTaCDRSLV6Iv6yrF8fNBh9c2II3uu
```

**Où trouver**: https://dashboard.stripe.com/apikeys

---

## 🟡 VARIABLES OPTIONNELLES (Recommandées)

### OpenAI

```bash
OPENAI_API_KEY=sk-proj-ochcMwBSI98MLeIX9DV9...
```

**Où trouver**: https://platform.openai.com/api-keys

### Cloudinary

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=deh4aokbx
```

```bash
CLOUDINARY_API_KEY=541766291559917
```

```bash
CLOUDINARY_API_SECRET=s0yc_QR4w9IsM6_HRq2hM5SDnfI
```

**Où trouver**: https://cloudinary.com/console

### SendGrid (Emails)

```bash
SENDGRID_API_KEY=SG.FcB2AoR_QqSWnoIxaNV2xQ...
```

```bash
SENDGRID_DOMAIN=luneo.app
```

```bash
SENDGRID_FROM_NAME=Luneo
```

```bash
SENDGRID_FROM_EMAIL=no-reply@luneo.app
```

**Où trouver**: https://app.sendgrid.com/settings/api_keys

### Redis (Upstash)

```bash
UPSTASH_REDIS_REST_URL=https://eu-west-1-xxx.upstash.io
```

```bash
UPSTASH_REDIS_REST_TOKEN=AXXAAXX...
```

**Où trouver**: https://console.upstash.com/

### Sentry (Monitoring)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736
```

```bash
SENTRY_AUTH_TOKEN=...
```

**Où trouver**: https://sentry.io/settings/

### Encryption

```bash
MASTER_ENCRYPTION_KEY=[Générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
```

---

## 📝 NOTES IMPORTANTES

### Variables NEXT_PUBLIC_*

- Ces variables sont **exposées au client** (navigateur)
- Ne jamais mettre de secrets dans ces variables
- Accessibles via `process.env.NEXT_PUBLIC_*`

### Variables sans NEXT_PUBLIC_

- Ces variables sont **uniquement côté serveur**
- Sécurisées, non exposées au client
- Accessibles uniquement dans les API routes et Server Components

### Redéploiement

- ⚠️ **Important**: Après modification de variables, redéployer l'application
- Vercel peut nécessiter un redéploiement manuel
- Utiliser **"Redeploy"** dans Vercel Dashboard

---

## ✅ CHECKLIST

- [ ] NEXT_PUBLIC_SUPABASE_URL configuré
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configuré
- [ ] SUPABASE_SERVICE_ROLE_KEY configuré
- [ ] NEXT_PUBLIC_API_URL configuré
- [ ] NEXT_PUBLIC_APP_URL configuré
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID configuré
- [ ] GOOGLE_CLIENT_SECRET configuré
- [ ] NEXT_PUBLIC_GITHUB_CLIENT_ID configuré
- [ ] GITHUB_CLIENT_SECRET configuré
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configuré
- [ ] STRIPE_SECRET_KEY configuré
- [ ] STRIPE_WEBHOOK_SECRET configuré
- [ ] OPENAI_API_KEY configuré (optionnel)
- [ ] Variables Cloudinary configurées (optionnel)
- [ ] Variables SendGrid configurées (optionnel)
- [ ] Variables Redis configurées (optionnel)
- [ ] Variables Sentry configurées (optionnel)

---

**Une fois toutes les variables configurées, vous pouvez déployer !** 🚀


