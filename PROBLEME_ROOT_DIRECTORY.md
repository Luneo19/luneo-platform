# ⚠️ PROBLÈME ROOT DIRECTORY - ACTION REQUISE

**Date** : 23 décembre 2025

---

## 🔴 PROBLÈME IDENTIFIÉ

L'erreur `The provided path "~/luneo-platform/apps/frontend/apps/frontend" does not exist` indique que Vercel essaie d'ajouter le Root Directory deux fois.

**Cause** : 
- Root Directory dans Dashboard = `apps/frontend`
- Déploiement depuis `apps/frontend/`
- Vercel cherche : `apps/frontend/apps/frontend` ❌

---

## ✅ SOLUTION

### Option 1 : Root Directory = "." (Recommandé si déploiement depuis apps/frontend)

1. **Vercel Dashboard** : https://vercel.com/luneos-projects/frontend/settings
2. **Settings → General** :
   - Root Directory : Changer de `apps/frontend` à **`.`** (point)
   - **Save**

3. **Déployer depuis** : `apps/frontend/`
   ```bash
   cd apps/frontend
   vercel --prod --yes
   ```

### Option 2 : Root Directory = "apps/frontend" (Si déploiement depuis racine)

1. **Root Directory** : Garder `apps/frontend`
2. **Déployer depuis** : Racine du monorepo
   ```bash
   cd /Users/emmanuelabougadous/luneo-platform
   vercel --prod --yes --cwd apps/frontend
   ```

---

## 📊 CONFIGURATION ACTUELLE

- **Root Directory Dashboard** : `apps/frontend`
- **Déploiement depuis** : `apps/frontend/`
- **Résultat** : Vercel cherche `apps/frontend/apps/frontend` ❌

---

## 🎯 RECOMMANDATION

**Option 1** est recommandée car :
- Plus simple
- Déploiement direct depuis `apps/frontend/`
- Pas besoin de spécifier `--cwd`

---

**⚠️ Cette correction est CRITIQUE pour que le build fonctionne.**
