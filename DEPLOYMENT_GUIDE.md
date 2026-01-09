# 🚀 Guide de Déploiement - Luneo Platform

## ✅ Pré-requis Terminés

- ✅ Routes backend créées (23 routes)
- ✅ Routes frontend migrées (25 routes)
- ✅ Builds backend et frontend: OK
- ✅ Railway CLI installé
- ✅ Configuration Railway (`railway.toml`)
- ✅ Configuration Vercel (`vercel.json`)

---

## 🚂 Déploiement Backend sur Railway

### Étape 1 : Connexion à Railway

```bash
cd apps/backend
railway login
```

Cette commande va ouvrir votre navigateur pour vous connecter.

### Étape 2 : Lier le Projet (si pas déjà fait)

```bash
# Si vous avez déjà un projet Railway
railway link -p <PROJECT_ID>

# Ou créer un nouveau projet
railway init
```

### Étape 3 : Configurer les Variables d'Environnement

Dans Railway Dashboard ou via CLI:

```bash
# Variables OBLIGATOIRES
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_EXPIRES_IN="15m"
railway variables set JWT_REFRESH_EXPIRES_IN="7d"

# Variables IMPORTANTES (selon vos besoins)
railway variables set FRONTEND_URL="https://www.luneo.app"
railway variables set CORS_ORIGIN="https://www.luneo.app"
railway variables set API_PREFIX="/api"

# Variables pour les services externes (à configurer)
# railway variables set SENDGRID_API_KEY="SG.xxx..."
# railway variables set STRIPE_SECRET_KEY="sk_live_..."
# railway variables set OPENAI_API_KEY="sk-..."
# railway variables set CLOUDINARY_CLOUD_NAME="xxx"
# railway variables set CLOUDINARY_API_KEY="xxx"
# railway variables set CLOUDINARY_API_SECRET="xxx"
```

**⚠️ Important**: Créez d'abord une base PostgreSQL dans Railway Dashboard:
- Cliquez sur "+ New" → "Database" → "PostgreSQL"
- Railway génère automatiquement `DATABASE_URL`
- Utilisez `${{Postgres.DATABASE_URL}}` pour référencer la DB

### Étape 4 : Configurer le Root Directory

Dans Railway Dashboard:
- Allez dans votre service backend
- Settings → Root Directory
- Configurez: `apps/backend` (ou laissez vide si configuré dans `railway.toml`)

### Étape 5 : Exécuter les Migrations Prisma

```bash
cd apps/backend
railway run pnpm prisma migrate deploy
```

### Étape 6 : Déployer

```bash
# Option 1: Via Railway CLI
cd apps/backend
railway up

# Option 2: Via GitHub (automatique après push)
git push origin main
```

### Étape 7 : Vérifier le Déploiement

```bash
# Voir les logs
railway logs

# Obtenir l'URL du service
railway domain

# Tester le health check
curl https://<your-railway-domain>/health
```

---

## 🌐 Déploiement Frontend sur Vercel

### Étape 1 : Connexion à Vercel (si via CLI)

```bash
cd apps/frontend
vercel login
```

### Étape 2 : Lier le Projet

```bash
cd apps/frontend
vercel link
```

### Étape 3 : Configurer les Variables d'Environnement

Dans Vercel Dashboard ou via CLI:

```bash
# Variables OBLIGATOIRES
vercel env add NEXT_PUBLIC_BACKEND_URL "https://<your-railway-domain>" production
vercel env add NEXT_PUBLIC_API_URL "https://<your-railway-domain>/api" production

# Variables pour Supabase (si utilisées)
# vercel env add NEXT_PUBLIC_SUPABASE_URL "https://xxx.supabase.co" production
# vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "xxx" production

# Variables pour les services externes
# vercel env add STRIPE_PUBLISHABLE_KEY "pk_live_xxx" production
# vercel env add CLOUDINARY_CLOUD_NAME "xxx" production
```

### Étape 4 : Configurer le Root Directory

Dans Vercel Dashboard:
- Allez dans votre projet
- Settings → General → Root Directory
- Configurez: `apps/frontend`

### Étape 5 : Déployer

```bash
# Option 1: Via Vercel CLI
cd apps/frontend
vercel --prod

# Option 2: Via GitHub (automatique après push)
git push origin main
```

### Étape 6 : Vérifier le Déploiement

```bash
# Voir les logs
vercel logs

# Ouvrir le dashboard
vercel open
```

---

## 🔄 Workflow Automatique (Recommandé)

### Via GitHub

1. **Connecter Railway à GitHub**:
   - Railway Dashboard → Service Backend → Settings → Source
   - Connecter votre repo `luneo-platform`
   - Root Directory: `apps/backend`
   - Branch: `main`

2. **Connecter Vercel à GitHub**:
   - Vercel Dashboard → Add New Project
   - Importez votre repo `luneo-platform`
   - Root Directory: `apps/frontend`
   - Framework Preset: Next.js

3. **Déploiements automatiques**:
   ```bash
   git add .
   git commit -m "Deploy: Migrations routes et modules backend"
   git push origin main
   ```
   - Railway déploie automatiquement le backend
   - Vercel déploie automatiquement le frontend

---

## ✅ Checklist Post-Déploiement

### Backend (Railway)
- [ ] Health check fonctionne: `curl https://<domain>/health`
- [ ] Migrations Prisma appliquées: `railway run pnpm prisma migrate deploy`
- [ ] Variables d'environnement configurées
- [ ] Logs accessibles: `railway logs`
- [ ] Domaine Railway configuré (optionnel)

### Frontend (Vercel)
- [ ] Build réussit
- [ ] Variables d'environnement configurées
- [ ] URL backend correcte dans `NEXT_PUBLIC_BACKEND_URL`
- [ ] Déploiement accessible
- [ ] Logs accessibles: `vercel logs`

---

## 🧪 Tests Post-Déploiement

### Tester les Nouvelles Routes Backend

```bash
# Backend URL
BACKEND_URL="https://<your-railway-domain>"

# Health check
curl $BACKEND_URL/health

# Test des nouvelles routes (avec authentification)
curl -X POST $BACKEND_URL/api/render/3d/highres \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"configurationId": "test"}'

curl -X POST $BACKEND_URL/api/customization/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": "test", "zoneId": "test", "prompt": "test"}'
```

### Tester le Frontend

1. Accéder à `https://<your-vercel-domain>`
2. Tester le login/register
3. Tester les nouvelles fonctionnalités migrées
4. Vérifier les appels API vers le backend

---

## 📊 Résumé des Routes Migrées

### Backend Routes Créées (23 routes)
- ✅ Design: versions, export-print
- ✅ Webhooks: Stripe, Shopify, WooCommerce
- ✅ AR: export, convert-usdz, render-highres, export-ar
- ✅ AI: smart-crop, text-to-design
- ✅ Referral: join, withdraw
- ✅ Marketplace: seller/connect
- ✅ Cron: analytics-digest, cleanup
- ✅ Products: upload-model, zones
- ✅ Customization: generate
- ✅ Bracelet: render

### Frontend Routes Migrées (25 routes)
- ✅ Toutes les routes prioritaires forwardent vers le backend

---

## 🆘 Dépannage

### Backend ne démarre pas sur Railway
- Vérifier les logs: `railway logs`
- Vérifier `DATABASE_URL` est correct
- Vérifier que les migrations Prisma sont appliquées
- Vérifier le Root Directory dans Railway

### Frontend ne se connecte pas au backend
- Vérifier `NEXT_PUBLIC_BACKEND_URL` dans Vercel
- Vérifier CORS est configuré dans le backend
- Vérifier les logs Vercel: `vercel logs`

### Migrations Prisma échouent
```bash
cd apps/backend
railway run pnpm prisma migrate deploy
railway run pnpm prisma generate
```

---

## 🎯 Prochaines Étapes

1. ✅ Déployer backend sur Railway
2. ✅ Déployer frontend sur Vercel
3. ✅ Configurer les variables d'environnement
4. ✅ Tester les routes en production
5. ✅ Configurer les domaines personnalisés (optionnel)
