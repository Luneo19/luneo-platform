# ⚠️ ACTION REQUISE - VERCEL DASHBOARD

**Date** : 23 décembre 2025

---

## 🔴 PROBLÈME IDENTIFIÉ

Le **Dashboard Vercel écrase** le `buildCommand` de `vercel.json`.

**Configuration Dashboard** :
- Build Command: `pnpm run build` (écrase vercel.json)

**Configuration vercel.json** :
- Build Command: `bash scripts/setup-local-packages.sh; pnpm run build`

**Résultat** : Le Dashboard utilise `pnpm run build` au lieu du script.

---

## ✅ SOLUTION IMMÉDIATE

### Vider le Build Command dans Dashboard

1. **Ouvrir** : https://vercel.com/luneos-projects/frontend/settings
2. **Settings → Build and Deployment** :
   - **Build Command** : **EFFACER TOUT** (laisser complètement vide)
   - **Save**

**Raison** : Quand le Build Command est vide dans le Dashboard, Vercel utilise celui de `vercel.json`.

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

Une fois le Build Command vidé dans le Dashboard :

1. **Déclencher un nouveau déploiement** :
   - Deployments → Redeploy
   - OU attendre le prochain commit

2. **Vérifier** :
   - Le build devrait prendre 3-5 minutes
   - Le script `setup-local-packages.sh` devrait s'exécuter
   - Le build Next.js devrait réussir

---

**⚠️ Cette action est CRITIQUE pour que le build utilise le script correct.**
