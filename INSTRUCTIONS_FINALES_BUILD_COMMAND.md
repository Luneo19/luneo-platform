# ⚠️ INSTRUCTIONS FINALES - BUILD COMMAND

**Date** : 23 décembre 2025

---

## 🔴 PROBLÈME IDENTIFIÉ

Le **Dashboard Vercel écrase** le `buildCommand` de `vercel.json`.

**Configuration Dashboard** :
- Build Command: `pnpm run build` ❌ (écrase vercel.json)

**Configuration vercel.json** :
- Build Command: `bash scripts/setup-local-packages.sh; pnpm run build` ✅

**Résultat** : Le Dashboard utilise `pnpm run build` au lieu du script.

---

## ✅ SOLUTION 1 : Via Script (Recommandé)

### Étape 1 : Créer Token Vercel

1. Aller sur : **https://vercel.com/account/tokens**
2. Cliquer sur **"Create Token"**
3. Nommer : "Luneo Build Command Fix"
4. **Copier le token**

### Étape 2 : Exécuter le Script

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
export VERCEL_TOKEN="votre-token"
bash scripts/fix-build-command.sh
```

Le script va automatiquement :
- ✅ Vider le Build Command dans Dashboard via API
- ✅ Confirmer que Vercel utilisera maintenant `vercel.json`

---

## ✅ SOLUTION 2 : Via Dashboard (Manuel)

1. **Ouvrir** : https://vercel.com/luneos-projects/frontend/settings
2. **Settings → Build and Deployment** :
   - **Build Command** : **EFFACER TOUT** (laisser complètement vide)
   - **Save**

---

## 📊 CONFIGURATION ATTENDUE

### Dashboard
- Build Command: **(vide)** → utilise `vercel.json` ✅
- Install Command: `pnpm install --frozen-lockfile` (peut rester)
- Output Directory: `.next` ✅

### vercel.json
- Build Command: `bash scripts/setup-local-packages.sh; pnpm run build` ✅

---

## 🚀 APRÈS CORRECTION

Une fois le Build Command vidé :

1. **Déclencher un nouveau déploiement** :
   ```bash
   cd apps/frontend
   vercel --prod --yes
   ```

2. **Vérifier** :
   - Le build devrait prendre 3-5 minutes
   - Le script `setup-local-packages.sh` devrait s'exécuter
   - Le build Next.js devrait réussir

---

**⚠️ Cette action est CRITIQUE pour que le build utilise le script correct.**
