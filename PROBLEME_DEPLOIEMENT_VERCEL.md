# ⚠️ Problème Déploiement Vercel

**Date** : 5 janvier 2026, 01:25

## ✅ Situation corrigée (janvier 2026)

L’erreur initiale `pnpm install --no-frozen-lockfile exited with 1` venait de deux sources principales :

1. **Mauvais projet Vercel ciblé**  
   - Le déploiement était lancé à la racine du monorepo, ce qui utilisait le projet `luneo-frontend` au lieu du projet officiel `frontend`.  
   - Résultat : consommation du quota de déploiements gratuits sur le mauvais projet, et configuration monorepo non adaptée.

2. **Dépendances manquantes côté frontend**  
   - Le build échouait ensuite sur des erreurs TypeScript/Next.js du type :  
     - `Cannot find module 'qrcode' or its corresponding type declarations.`  
   - Ces libs (`qrcode`, mais aussi déjà rencontré auparavant `bcryptjs`, `speakeasy`) étaient utilisées dans `apps/frontend` sans être déclarées dans `apps/frontend/package.json`.

## ✅ Corrections appliquées

1. **Ciblage correct du projet Vercel**
   - Le dossier `apps/frontend` est désormais **lié explicitement** au projet `frontend` :
     ```bash
     vercel link --cwd apps/frontend --project frontend --yes
     ```
   - Les déploiements manuels doivent se faire **uniquement** avec :
     ```bash
     vercel --prod --yes --cwd apps/frontend
     ```
   - Règle d’or : **ne jamais** lancer `vercel --prod` à la racine du repo, sinon Vercel peut cibler `luneo-frontend` et consommer le crédit API gratuit.

2. **Dépendances frontend corrigées**
   - Ajout dans `apps/frontend/package.json` :
     ```json
     "dependencies": {
       // ...
       "qrcode": "^1.5.3"
     },
     "devDependencies": {
       // ...
       "@types/qrcode": "^1.5.5"
     }
     ```
   - Rappel : toutes les libs utilisées dans `src/lib`, les API routes ou les services server-side du frontend doivent être dans `dependencies` (et leurs types éventuels dans `devDependencies`).

## 🧱 Nouveau process à respecter

1. **Avant tout déploiement Vercel frontend**
   ```bash
   cd apps/frontend

   # Vérifier le build local
   pnpm build

   # Si une erreur "Cannot find module" apparaît :
   #   -> ajouter la lib dans apps/frontend/package.json (dependencies + types éventuels)
   ```

2. **Pour déployer en production sans brûler le quota**
   ```bash
   # Toujours depuis la racine du monorepo,
   # mais en ciblant le bon cwd :
   vercel --prod --yes --cwd apps/frontend
   ```

3. **À ne plus jamais faire**
   - ❌ `vercel --prod --yes` lancé à la racine du repo  
   - ❌ Ajouter des libs utilisées côté serveur seulement dans le root `package.json` sans les déclarer dans `apps/frontend/package.json`.




