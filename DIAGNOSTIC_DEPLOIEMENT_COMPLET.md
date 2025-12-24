# 🚀 DIAGNOSTIC ET CORRECTION DÉPLOIEMENT COMPLET

**Date**: $(date)  
**Projet**: Luneo Platform  
**Backend**: Railway (NestJS)  
**Frontend**: Vercel (Next.js 15)

---

## 🔴 ERREURS CRITIQUES BLOQUANTES

### 1. BACKEND (RAILWAY) - Configuration Root Directory

**Problème**: Le `railway.toml` utilise `cd apps/backend` dans le `startCommand`, mais Railway doit être configuré avec le **Root Directory** = `apps/backend` dans les settings du projet.

**Impact**: Railway ne trouve pas le fichier `dist/src/main.js` car il cherche depuis la racine du repo.

**Solution**: 
- Option A (Recommandée): Configurer Railway Root Directory = `apps/backend`
- Option B: Corriger le `railway.toml` pour utiliser le bon chemin

### 2. BACKEND (RAILWAY) - Port dynamique

**Problème**: Le `railway.toml` définit `PORT = "3001"` en dur, mais Railway fournit automatiquement la variable `$PORT` qui doit être utilisée.

**Impact**: L'application peut ne pas démarrer si Railway assigne un port différent.

**Solution**: Utiliser `process.env.PORT` dans le code (déjà fait) et supprimer la définition fixe dans `railway.toml`.

### 3. BACKEND (RAILWAY) - Version Node.js

**Problème**: Le `nixpacks.toml` spécifie `nodejs_18` mais le `package.json` requiert `>=18.0.0`. Railway pourrait utiliser Node 20 par défaut.

**Impact**: Incompatibilité potentielle de versions.

**Solution**: Mettre à jour `nixpacks.toml` pour utiliser Node 20.

### 4. BACKEND (RAILWAY) - Variables d'environnement manquantes

**Problème**: Les variables suivantes sont **OBLIGATOIRES** et doivent être configurées dans Railway :
- `DATABASE_URL` (requis par Zod schema)
- `JWT_SECRET` (minimum 32 caractères)
- `JWT_REFRESH_SECRET` (minimum 32 caractères)

**Impact**: L'application ne démarre pas si ces variables sont manquantes (validation Zod échoue).

### 5. FRONTEND (VERCEL) - Conflit de configuration

**Problème**: Il y a **DEUX** fichiers `vercel.json` :
- `/vercel.json` (racine) - configure pour monorepo
- `/apps/frontend/vercel.json` - configuration spécifique frontend

**Impact**: Vercel peut être confus sur quelle configuration utiliser.

**Solution**: Supprimer le `vercel.json` à la racine et utiliser uniquement celui dans `apps/frontend/`.

### 6. FRONTEND (VERCEL) - Build Command

**Problème**: Le `vercel.json` racine utilise `pnpm --filter luneo-frontend run build`, mais Vercel doit être configuré avec le **Root Directory** = `apps/frontend`.

**Impact**: Le build peut échouer si Vercel ne détecte pas correctement le monorepo.

**Solution**: Configurer Vercel Root Directory = `apps/frontend` et utiliser le `vercel.json` local.

---

## 🟡 AVERTISSEMENTS & OPTIMISATIONS

### Backend

1. **Prisma Generate**: Le `nixpacks.toml` exécute `pnpm prisma generate` avec `|| echo 'Prisma generate skipped'`, ce qui peut masquer des erreurs.
2. **Migrations**: Les migrations sont exécutées avec `|| true`, ce qui peut laisser la DB dans un état incohérent.
3. **Health Check**: Le health check endpoint `/health` doit être testé avant le déploiement.

### Frontend

1. **Variables d'environnement**: Toutes les variables `NEXT_PUBLIC_*` doivent être configurées dans Vercel.
2. **API URL**: `NEXT_PUBLIC_API_URL` doit pointer vers l'URL Railway du backend.
3. **Build Optimization**: Le `next.config.mjs` désactive les erreurs TypeScript/ESLint en build, ce qui peut masquer des problèmes.

---

## ✅ CORRECTIONS À APPLIQUER

### Correction 1: `apps/backend/railway.toml`

```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
# IMPORTANT: Si Railway Root Directory = apps/backend, utiliser:
startCommand = "node dist/src/main.js"
# Sinon, utiliser:
# startCommand = "cd apps/backend && node dist/src/main.js"

[env]
NODE_ENV = "production"
# NE PAS définir PORT ici - Railway le fournit automatiquement via $PORT
```

### Correction 2: `apps/backend/nixpacks.toml`

```toml
# Configuration Nixpacks pour Railway
# Railway Root Directory doit être configuré sur apps/backend
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmds = [
  "npm install -g pnpm@8",
  "pnpm install --frozen-lockfile || pnpm install",
  "pnpm prisma generate"
]

[phases.build]
cmds = [
  "pnpm run build",
  "pnpm prisma migrate deploy"
]

[start]
cmd = "node dist/src/main.js"
```

### Correction 3: `apps/backend/Procfile`

```
web: node dist/src/main.js
```

### Correction 4: Supprimer `/vercel.json` (racine)

Le fichier `vercel.json` à la racine doit être supprimé car Vercel doit utiliser celui dans `apps/frontend/`.

### Correction 5: `apps/frontend/vercel.json` (déjà correct)

Le fichier `apps/frontend/vercel.json` est correct, mais vérifier que Vercel est configuré avec Root Directory = `apps/frontend`.

---

## 📦 COMMANDES À EXÉCUTER

### Backend (Railway)

```bash
# 1. Vérifier la structure du build
cd apps/backend
pnpm install
pnpm run build

# 2. Vérifier que dist/src/main.js existe
ls -la dist/src/main.js

# 3. Tester localement avec les variables d'environnement
export PORT=3001
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-32-char-secret-key-minimum"
export JWT_REFRESH_SECRET="your-32-char-refresh-secret-key"
node dist/src/main.js
```

### Frontend (Vercel)

```bash
# 1. Vérifier le build local
cd apps/frontend
pnpm install
pnpm run build

# 2. Vérifier que .next existe
ls -la .next

# 3. Tester localement
pnpm start
```

---

## ⚙️ CONFIGURATION RAILWAY

### Settings du Projet

1. **Root Directory**: `apps/backend`
2. **Build Command**: (géré par nixpacks.toml)
3. **Start Command**: `node dist/src/main.js`

### Variables d'Environnement Requises

```env
# OBLIGATOIRES
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-minimum

# OPTIONNELLES (mais recommandées)
PORT=3001  # Railway fournit automatiquement $PORT, mais peut être défini explicitement
API_PREFIX=/api
CORS_ORIGIN=https://app.luneo.app,https://luneo.app
FRONTEND_URL=https://app.luneo.app

# Redis (optionnel)
REDIS_URL=redis://host:port

# Stripe (optionnel)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Monitoring (optionnel)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
```

### Configuration Railway via CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Définir les variables d'environnement
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-32-char-secret"
railway variables set JWT_REFRESH_SECRET="your-32-char-refresh-secret"
railway variables set NODE_ENV="production"

# Déployer
railway up
```

---

## ⚙️ CONFIGURATION VERCEL

### Settings du Projet

1. **Root Directory**: `apps/frontend`
2. **Framework Preset**: Next.js
3. **Build Command**: `pnpm run build` (automatique)
4. **Output Directory**: `.next` (automatique)
5. **Install Command**: `pnpm install` (automatique)

### Variables d'Environnement Requises

```env
# API Configuration (OBLIGATOIRE)
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app

# Authentication - Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe (OBLIGATOIRE pour paiements)
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

### Configuration Vercel via Dashboard

1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner le projet
3. Settings → General → Root Directory = `apps/frontend`
4. Settings → Environment Variables → Ajouter toutes les variables ci-dessus

### Configuration Vercel via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Définir les variables d'environnement
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... etc

# Déployer
vercel --prod
```

---

## 🧪 TESTS DE VALIDATION

### Backend (Railway)

```bash
# 1. Health Check
curl https://your-railway-backend.up.railway.app/health

# Réponse attendue:
# {"status":"ok","timestamp":"..."}

# 2. API Endpoint
curl https://your-railway-backend.up.railway.app/api

# 3. Vérifier les logs Railway
railway logs
```

### Frontend (Vercel)

```bash
# 1. Accéder à l'application
curl https://app.luneo.app

# 2. Vérifier que l'API est accessible
# Ouvrir la console du navigateur et vérifier:
# - Pas d'erreurs CORS
# - Les appels API fonctionnent
# - NEXT_PUBLIC_API_URL est correct

# 3. Vérifier les logs Vercel
vercel logs
```

### Intégration Backend ↔ Frontend

```bash
# 1. Tester la connexion depuis le frontend
# Dans la console du navigateur:
fetch('https://your-railway-backend.up.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)

# 2. Vérifier CORS
# Les headers de réponse doivent inclure:
# Access-Control-Allow-Origin: https://app.luneo.app
```

---

## 📋 CHECKLIST FINALE PRODUCTION

### Backend (Railway)

- [ ] Root Directory configuré = `apps/backend`
- [ ] Variables d'environnement configurées (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET)
- [ ] Base de données connectée et migrée
- [ ] Health check endpoint `/health` fonctionnel
- [ ] CORS configuré pour le domaine Vercel
- [ ] Logs de production activés
- [ ] Build réussit sans erreurs
- [ ] Application démarre correctement
- [ ] Port dynamique ($PORT) utilisé

### Frontend (Vercel)

- [ ] Root Directory configuré = `apps/frontend`
- [ ] Variables d'environnement définies (NEXT_PUBLIC_*)
- [ ] URL backend configurée (NEXT_PUBLIC_API_URL)
- [ ] Build réussit sans erreurs
- [ ] Rewrites/Redirects configurés
- [ ] 404 handling en place
- [ ] Performance optimisée
- [ ] Pas d'erreurs dans la console

### Intégration

- [ ] Communication backend ↔ frontend testée
- [ ] CORS autorisé pour domaine Vercel
- [ ] HTTPS activé
- [ ] Authentification fonctionnelle
- [ ] Gestion des erreurs complète
- [ ] Monitoring configuré (Sentry)

---

## 🚨 PROBLÈMES CONNUS ET SOLUTIONS

### Problème 1: Railway ne trouve pas `dist/src/main.js`

**Cause**: Root Directory non configuré ou chemin incorrect.

**Solution**: 
1. Vérifier que Railway Root Directory = `apps/backend`
2. Vérifier que le build génère bien `dist/src/main.js`
3. Utiliser `railway logs` pour voir les erreurs exactes

### Problème 2: Vercel build échoue avec "Cannot find module"

**Cause**: Monorepo non détecté correctement.

**Solution**:
1. Vérifier que Vercel Root Directory = `apps/frontend`
2. Vérifier que `pnpm-workspace.yaml` est correct
3. Utiliser `vercel logs` pour voir les erreurs exactes

### Problème 3: CORS errors entre Vercel et Railway

**Cause**: CORS_ORIGIN mal configuré dans Railway.

**Solution**:
1. Définir `CORS_ORIGIN=https://app.luneo.app,https://luneo.app` dans Railway
2. Vérifier que le backend accepte les requêtes depuis Vercel

### Problème 4: Variables d'environnement non disponibles

**Cause**: Variables non définies ou mal nommées.

**Solution**:
1. Vérifier que toutes les variables sont définies dans Railway/Vercel
2. Vérifier que les noms correspondent exactement (case-sensitive)
3. Redéployer après avoir ajouté les variables

---

## 📞 SUPPORT

En cas de problème persistant:

1. **Railway**: Vérifier les logs avec `railway logs`
2. **Vercel**: Vérifier les logs avec `vercel logs` ou dans le dashboard
3. **Backend**: Vérifier les logs de l'application dans Railway
4. **Frontend**: Vérifier la console du navigateur et les logs Vercel

---

**Document généré automatiquement - Ne pas modifier manuellement**
