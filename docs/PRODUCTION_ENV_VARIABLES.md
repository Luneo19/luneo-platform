# 🔐 Variables d'Environnement Production - Luneo Platform

**Date:** Décembre 2024  
**Status:** Documentation complète

---

## 📋 Variables Obligatoires

### Frontend (Vercel)

#### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

#### Stripe
```bash
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx
```

#### OpenAI
```bash
OPENAI_API_KEY=sk-xxx
```

#### Cloudinary
```bash
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

#### Sentry
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx
SENTRY_AUTH_TOKEN=xxx
```

#### Redis (Upstash)
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
```

#### Application
```bash
NEXT_PUBLIC_APP_URL=https://luneo.app
NODE_ENV=production
```

---

## 📋 Variables Optionnelles

### Analytics
```bash
NEXT_PUBLIC_GA_ID=G-xxx
NEXT_PUBLIC_VERCEL_ENV=production
```

### Features
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
```

### Development
```bash
ANALYZE=false
NEXT_TELEMETRY_DISABLED=1
```

---

## 🔒 Sécurité

### Secrets
- ✅ Ne jamais commiter les secrets dans Git
- ✅ Utiliser Vercel Environment Variables
- ✅ Utiliser GitHub Secrets pour CI/CD
- ✅ Rotation régulière des secrets

### Validation
- [ ] Toutes les variables obligatoires configurées
- [ ] Secrets sécurisés
- [ ] Pas de secrets dans le code
- [ ] Variables de production différentes de staging

---

## 📝 Configuration Vercel

### Ajouter Variables
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner le projet
3. Settings > Environment Variables
4. Ajouter variables
5. Sélectionner environnements (Production, Preview, Development)

### Variables par Environnement
- **Production:** Toutes les variables
- **Preview:** Variables de staging
- **Development:** Variables de développement

---

## ✅ Checklist

### Avant Déploiement
- [ ] Toutes les variables obligatoires configurées
- [ ] Secrets sécurisés
- [ ] Variables de production testées
- [ ] Pas de secrets dans le code

### Après Déploiement
- [ ] Application fonctionne
- [ ] Aucune erreur de configuration
- [ ] Services externes connectés
- [ ] Monitoring actif

---

**Dernière mise à jour:** Décembre 2024








