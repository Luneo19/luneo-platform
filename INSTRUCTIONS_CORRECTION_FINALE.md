# 🚨 INSTRUCTIONS CORRECTION FINALE - URGENT

**Date** : 23 décembre 2025

---

## ✅ PROBLÈME CONFIRMÉ

Le `vercel project inspect` confirme que la configuration est incorrecte :

```
Framework Settings
  Framework Preset: Other  ❌ (devrait être Next.js)
  Build Command: `npm run vercel-build` or `npm run build`  ❌ (devrait être vide)
  Output Directory: `public` if it exists, or `.`  ❌ (devrait être `.next`)
```

---

## 🔧 SOLUTION IMMÉDIATE

### Option 1 : Correction via Vercel Dashboard (RECOMMANDÉ - 2 minutes)

1. **Ouvrir** : https://vercel.com/luneos-projects/luneo-frontend/settings

2. **Settings → General → Framework Settings** :
   - Cliquer sur "Framework Preset"
   - Sélectionner **"Next.js"**
   - **Save**

3. **Settings → Build and Deployment** :
   - **Build Command** : **EFFACER TOUT** (laisser complètement vide)
   - **Output Directory** : Changer à **`.next`**
   - **Install Command** : **EFFACER TOUT** (laisser complètement vide)
   - **Save**

4. **Déclencher Nouveau Déploiement** :
   - Aller dans **Deployments**
   - Cliquer sur **"Redeploy"** sur le dernier déploiement
   - Ou attendre le prochain commit (déjà poussé)

---

### Option 2 : Correction via API (Si vous avez un token)

1. **Obtenir Token** : https://vercel.com/account/tokens
2. **Exporter** : `export VERCEL_TOKEN="votre-token"`
3. **Exécuter** :
   ```bash
   cd apps/frontend
   curl -X PATCH "https://api.vercel.com/v9/projects/prj_eQ4hMNnXDLlNmsmkfKDSkCdlNQr2?teamId=team_hEYzAnyaxsCQkF2sJqEzWKS9" \
     -H "Authorization: Bearer $VERCEL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "framework": "nextjs",
       "buildCommand": null,
       "outputDirectory": ".next",
       "installCommand": null
     }'
   ```

---

## ✅ VÉRIFICATION

Après correction, vérifier :

1. **Build prend plusieurs minutes** (pas 6 secondes)
2. **Routes fonctionnent** : https://luneo.app
3. **Fichiers statiques accessibles** : `/_next/static/*`

---

## 📊 CONFIGURATION ATTENDUE

### Avant (Actuel) ❌
- Framework Preset: **Other**
- Build Command: `npm run vercel-build` or `npm run build`
- Output Directory: `public` or `.`

### Après (Attendu) ✅
- Framework Preset: **Next.js**
- Build Command: **(vide)** → utilise `vercel.json`
- Output Directory: **`.next`**
- Install Command: **(vide)** → utilise `vercel.json`

---

**⚠️ Cette correction est CRITIQUE pour que le build fonctionne correctement.**
