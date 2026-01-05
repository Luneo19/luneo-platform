# 🔧 Configuration Railway - Instructions Finales

## ❌ Problème Actuel

- Root Directory **N'EST PAS** configuré (bouton "Add Root Directory" visible)
- Builder est sur "Nixpacks" (mais marqué Deprecated)
- Le build échoue car Railway ne sait pas où trouver le code

## ✅ Solution : Ajouter Root Directory

### Étapes PRÉCISES :

1. **Dans Railway Dashboard, section "Source":**
   - Cliquez sur le bouton **"Add Root Directory"**
   - Un champ de texte apparaîtra
   - Entrez **EXACTEMENT** : `apps/backend`
     - ❌ PAS `/apps/backend` (pas de / au début)
     - ❌ PAS `apps/backend/` (pas de / à la fin)
     - ✅ `apps/backend` (exactement comme ça)

2. **Cliquez sur "Update"** (en bas de la page)

3. **Railway redéploiera automatiquement**

## 📋 Configuration Attendue

Après avoir ajouté le Root Directory :

- **Root Directory:** `apps/backend`
- **Builder:** `Nixpacks` (ou Railpack si Nixpacks ne fonctionne pas)
- **Health Check Path:** `/api/v1/health`
- **Start Command:** `node dist/src/main.js`

## 🔍 Vérification

Une fois le Root Directory ajouté, Railway devrait :

1. Trouver `apps/backend/package.json`
2. Détecter `apps/backend/nixpacks.toml` (si Nixpacks)
3. Exécuter `pnpm install --frozen-lockfile`
4. Exécuter `pnpm build`
5. Démarrer avec `node dist/src/main.js`

## ⚠️ Si Nixpacks ne fonctionne toujours pas

Si après avoir ajouté le Root Directory, Nixpacks échoue encore :

1. Changez le Builder de "Nixpacks" à **"Railpack"**
2. Ajoutez un **Custom Build Command** :
   ```
   pnpm install --frozen-lockfile && pnpm build
   ```
3. Ajoutez un **Custom Start Command** :
   ```
   node dist/src/main.js
   ```

## 📋 URL Directe

https://railway.com/project/9b6c45fe-e44b-4fad-ba21-e88df51a39e4/service/5592b681-a0bf-42c0-b4d9-6bd28e62f3fc/settings



