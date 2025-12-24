# ⚡ COMMANDES RAPIDES - DÉPLOIEMENT

## 🚀 Déploiement Automatique (Recommandé)

### Déploiement Complet
```bash
# Depuis la racine du projet
./scripts/deploy-all.sh
```

### Déploiement Backend Seulement
```bash
./scripts/deploy-railway.sh
```

### Déploiement Frontend Seulement
```bash
./scripts/deploy-vercel.sh
```

---

## 🔐 Configuration des Variables d'Environnement

### Railway (Backend)
```bash
./scripts/setup-railway-env.sh
```

### Vercel (Frontend)
```bash
./scripts/setup-vercel-env.sh
```

---

## 📋 Installation des Prérequis

### Railway CLI
```bash
npm i -g @railway/cli
railway login
```

### Vercel CLI
```bash
npm i -g vercel
vercel login
```

---

## 🔗 Lier les Projets

### Railway
```bash
cd apps/backend
railway link
```

### Vercel
```bash
cd apps/frontend
vercel link
```

---

## 🎯 Configuration Manuelle (Alternative)

### Railway - Variables d'Environnement
```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-32-char-secret"
railway variables set JWT_REFRESH_SECRET="your-32-char-refresh-secret"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://app.luneo.app,https://luneo.app"
railway variables set FRONTEND_URL="https://app.luneo.app"
```

### Vercel - Variables d'Environnement
```bash
cd apps/frontend
echo "https://your-backend.up.railway.app/api" | vercel env add NEXT_PUBLIC_API_URL production
echo "https://app.luneo.app" | vercel env add NEXT_PUBLIC_APP_URL production
echo "https://your-project.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "your-supabase-anon-key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

---

## 🚀 Déploiement Manuel

### Railway
```bash
cd apps/backend
railway up
```

### Vercel
```bash
cd apps/frontend
vercel --prod
```

---

## 📊 Vérification

### Backend
```bash
# Logs
railway logs

# Health check
curl $(railway domain)/health

# Status
railway status
```

### Frontend
```bash
# Logs
vercel logs

# Liste des déploiements
vercel ls
```

---

## 🔧 Configuration Root Directory

### Railway Dashboard
1. Aller sur [railway.app](https://railway.app)
2. Sélectionner le projet backend
3. Settings → General → Root Directory
4. Définir: `apps/backend`

### Vercel Dashboard
1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner le projet frontend
3. Settings → General → Root Directory
4. Définir: `apps/frontend`

---

## 🆘 En Cas de Problème

### Backend ne démarre pas
```bash
# Vérifier les logs
railway logs

# Vérifier les variables
railway variables

# Rebuild
cd apps/backend
pnpm run build
railway up
```

### Frontend ne build pas
```bash
# Vérifier les logs
vercel logs

# Vérifier les variables
vercel env ls

# Rebuild local
cd apps/frontend
pnpm run build

# Redéployer
vercel --prod
```

---

## 📚 Documentation Complète

- `DIAGNOSTIC_DEPLOIEMENT_COMPLET.md` - Diagnostic détaillé
- `GUIDE_DEPLOIEMENT_RAPIDE.md` - Guide étape par étape
- `VARIABLES_ENVIRONNEMENT_RAILWAY.md` - Variables Railway
- `VARIABLES_ENVIRONNEMENT_VERCEL.md` - Variables Vercel
