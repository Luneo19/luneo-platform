# ⚠️ CORRECTION ROOT DIRECTORY - ACTION REQUISE

**Date** : 23 décembre 2025

---

## 🔴 PROBLÈME IDENTIFIÉ

Le projet `frontend` a **Root Directory = "."** (racine) alors que le code est dans **`apps/frontend`**.

Cela cause l'échec de `pnpm install` car Vercel essaie d'installer depuis la racine du monorepo au lieu de `apps/frontend`.

---

## ✅ SOLUTION

### Option 1 : Correction via Vercel Dashboard (RECOMMANDÉ)

1. **Ouvrir** : https://vercel.com/luneos-projects/frontend/settings

2. **Settings → General** :
   - Trouver **"Root Directory"**
   - Changer de **`.`** à **`apps/frontend`**
   - **Save**

3. **Déclencher Nouveau Déploiement** :
   - Deployments → Redeploy

---

### Option 2 : Correction via API (Si Token Disponible)

```bash
export VERCEL_TOKEN="votre-token"
curl -X PATCH "https://api.vercel.com/v9/projects/prj_lGBYTHVcIQqZdP1ZFfiqziWhPSo9?teamId=team_hEYzAnyaxsCQkF2sJqEzWKS9" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory": "apps/frontend"}'
```

---

## 📊 CONFIGURATION ATTENDUE

### Avant ❌
- Root Directory: `.` (racine)

### Après ✅
- Root Directory: `apps/frontend`

---

**⚠️ Cette correction est CRITIQUE pour que le build fonctionne correctement.**
