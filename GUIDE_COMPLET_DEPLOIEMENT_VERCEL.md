# 🚀 GUIDE COMPLET - RÉUSSIR LE DÉPLOIEMENT VERCEL

**Date** : 23 décembre 2025

---

## 🎯 PROBLÈME

Les déploiements échouent après **2-4 secondes**, indiquant un problème très tôt dans le processus de build.

---

## ✅ SOLUTIONS APPLIQUÉES

### 1. Configuration `vercel.json` Améliorée

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

**Changements** :
- ✅ `installCommand` : Active Corepack et installe pnpm explicitement
- ✅ `buildCommand` : Simplifié, script de setup puis build

---

## 📋 CHECKLIST COMPLÈTE

### ✅ 1. Variables d'Environnement Vercel (CRITIQUE)

**Dans Vercel Dashboard → Settings → Environment Variables** :

**🔴 OBLIGATOIRES** :
```
ENABLE_EXPERIMENTAL_COREPACK=1
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://backend-production-9178.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://luneo.app
```

**Configuration** :
- ✅ Ajouter pour **Production**, **Preview**, **Development**
- ✅ `ENABLE_EXPERIMENTAL_COREPACK=1` est **CRITIQUE** pour que Corepack fonctionne

---

### ✅ 2. Configuration Vercel Dashboard

**Settings → General** :
- ✅ **Root Directory** : `apps/frontend`
- ✅ **Framework Preset** : `Next.js`
- ✅ **Build Command** : (laissé vide, utilise `vercel.json`)
- ✅ **Output Directory** : `.next`
- ✅ **Install Command** : (laissé vide, utilise `vercel.json`)

---

### ✅ 3. Fichiers de Configuration

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

## 🔍 DIAGNOSTIC DES ERREURS

### Erreur : "Build failed after 2-4 seconds"

**Causes possibles** :

1. **Corepack non activé** :
   - ❌ Variable `ENABLE_EXPERIMENTAL_COREPACK=1` manquante
   - ✅ **Solution** : Ajouter dans Vercel Environment Variables

2. **Script non exécutable** :
   - ❌ `setup-local-packages.sh` n'a pas les permissions
   - ✅ **Solution** : Le script gère déjà cela, mais vérifier les logs

3. **pnpm non trouvé** :
   - ❌ Corepack n'a pas activé pnpm
   - ✅ **Solution** : Vérifier que `installCommand` est exécuté

4. **Variables d'environnement manquantes** :
   - ❌ Variables critiques non définies
   - ✅ **Solution** : Vérifier avec `vercel env ls`

---

## 🚀 PROCÉDURES DE DÉPLOIEMENT

### Option A : Déploiement Automatique (Recommandé)

1. **Vérifier la configuration** :
   ```bash
   cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
   vercel env ls
   ```

2. **Vérifier que `ENABLE_EXPERIMENTAL_COREPACK=1` existe** :
   ```bash
   vercel env ls | grep ENABLE_EXPERIMENTAL_COREPACK
   ```

3. **Si manquant, l'ajouter** :
   ```bash
   echo "1" | vercel env add ENABLE_EXPERIMENTAL_COREPACK production preview development
   ```

4. **Commit et push** :
   ```bash
   git add .
   git commit -m "fix: improve Vercel deployment"
   git push origin main
   ```

5. **Vercel déploiera automatiquement**

---

### Option B : Déploiement Manuel

1. **Se connecter** :
   ```bash
   cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
   vercel login
   ```

2. **Vérifier les variables** :
   ```bash
   vercel env ls
   ```

3. **Déployer** :
   ```bash
   vercel deploy --prod --yes
   ```

---

## 🔧 SOLUTIONS ALTERNATIVES

### Solution 1 : Simplifier `installCommand`

Si Corepack pose problème, essayer :

```json
{
  "installCommand": "npm install -g pnpm@8.10.0 && pnpm install --no-frozen-lockfile"
}
```

### Solution 2 : Utiliser npm au lieu de pnpm

Si pnpm continue à poser problème :

```json
{
  "installCommand": "npm install",
  "buildCommand": "bash scripts/setup-local-packages.sh && npm run build"
}
```

**Note** : Nécessitera de modifier `package.json` pour utiliser npm.

### Solution 3 : Build sans script de setup

Tester sans le script de setup pour isoler le problème :

```json
{
  "buildCommand": "pnpm run build"
}
```

Si ça fonctionne, le problème vient du script `setup-local-packages.sh`.

---

## 📊 VÉRIFICATIONS

### 1. Vérifier les Logs Vercel

**Dashboard → Deployments → [Dernier déploiement] → Logs**

Chercher :
- ❌ `pnpm: command not found` → Corepack non activé
- ❌ `Module not found` → Packages locaux non copiés
- ❌ `Permission denied` → Script non exécutable
- ❌ `ENOENT` → Fichier ou répertoire manquant

### 2. Vérifier les Variables

```bash
vercel env ls
```

### 3. Tester Localement

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
pnpm install
bash scripts/setup-local-packages.sh
pnpm run build
```

Si ça fonctionne localement mais pas sur Vercel, c'est un problème de configuration Vercel.

---

## ✅ RÉSUMÉ DES ACTIONS

1. ✅ **`vercel.json`** : InstallCommand ajouté
2. ✅ **Guide complet** : `GUIDE_DEPLOIEMENT_VERCEL.md` créé
3. ✅ **Commit et push** : Modifications poussées

### ⚠️ ACTION REQUISE

**Vérifier que `ENABLE_EXPERIMENTAL_COREPACK=1` est défini dans Vercel Environment Variables** :

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel env ls | grep ENABLE_EXPERIMENTAL_COREPACK
```

Si absent :
```bash
echo "1" | vercel env add ENABLE_EXPERIMENTAL_COREPACK production preview development
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Vérifier `ENABLE_EXPERIMENTAL_COREPACK=1`** dans Vercel
2. ⏳ **Attendre le prochain déploiement** (automatique ou manuel)
3. ✅ **Vérifier les logs** en cas d'erreur
4. ✅ **Tester l'application** si le déploiement réussit

---

**✅ Guide complet créé. Suivez ces étapes pour réussir le déploiement.**
