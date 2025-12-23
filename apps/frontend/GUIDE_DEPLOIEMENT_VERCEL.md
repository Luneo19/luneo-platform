# 🚀 GUIDE COMPLET - DÉPLOIEMENT VERCEL RÉUSSI

**Date** : 23 décembre 2025

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### ✅ 1. Configuration Vercel Dashboard

#### Root Directory
- ✅ **Vérifier** : Vercel Dashboard → Settings → General → Root Directory = `apps/frontend`
- ✅ **Vérifier** : Framework Preset = `Next.js`

#### Environment Variables
Les variables suivantes **DOIVENT** être configurées dans Vercel Dashboard → Settings → Environment Variables :

**🔴 CRITIQUES (obligatoires)** :
```
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://backend-production-9178.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://luneo.app
```

**🟡 IMPORTANTES (recommandées)** :
```
ENABLE_EXPERIMENTAL_COREPACK=1
NODE_ENV=production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Configuration** :
- ✅ Ajouter pour **Production**, **Preview**, et **Development**
- ✅ Utiliser les secrets Vercel pour les clés sensibles

---

### ✅ 2. Configuration Fichiers

#### `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "corepack enable && corepack prepare pnpm@8.10.0 --activate && pnpm install --no-frozen-lockfile",
  "buildCommand": "bash scripts/setup-local-packages.sh && pnpm run build",
  "outputDirectory": ".next",
  "regions": ["cdg1"]
}
```

#### `package.json` (root)
```json
{
  "packageManager": "pnpm@8.10.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

#### `apps/frontend/package.json`
```json
{
  "packageManager": "pnpm@8.10.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### `apps/frontend/.npmrc`
```ini
engine-strict=false
auto-install-peers=true
shamefully-hoist=true
```

---

### ✅ 3. Script `setup-local-packages.sh`

Le script doit :
- ✅ Être exécutable (`chmod +x`)
- ✅ Gérer les erreurs gracieusement
- ✅ Copier les packages locaux dans `node_modules/@luneo/`
- ✅ Vérifier que les packages sont bien copiés

---

## 🚀 PROCÉDURE DE DÉPLOIEMENT

### Option 1 : Déploiement Automatique (Git Push)

1. **Vérifier la configuration** :
   ```bash
   cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
   git status
   ```

2. **Commit et push** :
   ```bash
   git add .
   git commit -m "fix: improve Vercel deployment configuration"
   git push origin main
   ```

3. **Vercel déploiera automatiquement** via GitHub integration

4. **Vérifier le déploiement** :
   - Vercel Dashboard → Deployments
   - Attendre que le build se termine (5-15 minutes)
   - Vérifier les logs en cas d'erreur

---

### Option 2 : Déploiement Manuel (CLI)

1. **Se connecter à Vercel** :
   ```bash
   cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
   vercel login
   ```

2. **Lier le projet** (si pas déjà fait) :
   ```bash
   vercel link
   ```

3. **Déployer en production** :
   ```bash
   vercel deploy --prod --yes
   ```

4. **Vérifier le déploiement** :
   ```bash
   vercel ls
   ```

---

## 🔍 DIAGNOSTIC DES ERREURS

### Erreur : "Build failed after 2-3 seconds"

**Causes possibles** :
1. ❌ Script `setup-local-packages.sh` non exécutable
2. ❌ Variables d'environnement manquantes
3. ❌ `pnpm install` échoue
4. ❌ Packages locaux non trouvés

**Solutions** :
1. ✅ Vérifier que le script est exécutable : `chmod +x scripts/setup-local-packages.sh`
2. ✅ Vérifier les variables d'environnement : `vercel env ls`
3. ✅ Vérifier les logs Vercel : Dashboard → Deployments → Logs
4. ✅ Vérifier que les packages existent : `ls -la src/lib/packages/`

---

### Erreur : "Module not found: @luneo/billing-plans"

**Cause** : Les packages locaux ne sont pas copiés correctement

**Solution** :
1. ✅ Vérifier le script `setup-local-packages.sh`
2. ✅ Vérifier que les packages ont un `dist/` et `package.json`
3. ✅ Vérifier les logs du build pour voir où ça échoue

---

### Erreur : "pnpm: command not found"

**Cause** : Corepack n'est pas activé

**Solution** :
1. ✅ Ajouter `ENABLE_EXPERIMENTAL_COREPACK=1` dans Vercel Environment Variables
2. ✅ Utiliser `installCommand` dans `vercel.json` avec `corepack enable`

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Vérifier le Statut
```bash
vercel ls
```

### 2. Vérifier les Domaines
```bash
vercel alias ls
```

### 3. Tester l'Application
```bash
curl -I https://luneo.app
```

**Statuts attendus** :
- ✅ `200 OK` → Application fonctionnelle
- ⚠️ `401 Authentication Required` → Domaine routé, vérification DNS en cours
- ❌ `404 Not Found` → Domaine non configuré

---

## 🔧 SOLUTION COMPLÈTE APPLIQUÉE

### Modifications Effectuées

1. **`vercel.json`** :
   - ✅ Ajout de `installCommand` avec Corepack
   - ✅ `buildCommand` simplifié et robuste

2. **Script `setup-local-packages.sh`** :
   - ✅ Amélioration de la gestion d'erreur
   - ✅ Logs détaillés pour le debugging
   - ✅ Vérification des packages après copie

3. **Configuration** :
   - ✅ `.npmrc` optimisé pour Vercel
   - ✅ `package.json` avec `packageManager` explicite

---

## 📊 STATISTIQUES DU PROJET

- ✅ **315 pages** (`page.tsx`)
- ✅ **851 fichiers** source
- ✅ **66,383 lignes** de code
- ✅ **29 routes dynamiques**
- ✅ **1.9GB** de build

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Commit les modifications** :
   ```bash
   git add apps/frontend/vercel.json
   git commit -m "fix: improve Vercel deployment with installCommand"
   git push origin main
   ```

2. ⏳ **Attendre le déploiement automatique** (5-15 minutes)

3. ✅ **Vérifier le déploiement** dans Vercel Dashboard

4. ✅ **Tester l'application** sur `https://luneo.app`

---

**✅ Guide complet créé. Suivez ces étapes pour réussir le déploiement sur Vercel.**
