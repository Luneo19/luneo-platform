# ✅ Correction - bcryptjs manquant

**Date** : 5 janvier 2026, 01:15

## 🔍 Problème Identifié

Le build Vercel échouait avec :
```
Module not found: Can't resolve 'bcryptjs'
```

**Fichiers affectés** :
- `./src/lib/services/AdminService.ts`
- `./src/lib/trpc/routers/profile.ts`
- `./src/lib/security/TwoFactorAuth.ts`

## ✅ Solution Appliquée

**Ajout de `bcryptjs` aux dépendances** :
```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

**Raison** :
- Ces fichiers sont des routes tRPC qui s'exécutent côté serveur (Server Components)
- Ils ont besoin de `bcryptjs` pour hasher/vérifier les mots de passe
- `bcryptjs` n'était pas dans les dépendances du frontend

## 📋 Changements

1. ✅ `bcryptjs` ajouté aux `dependencies` dans `apps/frontend/package.json`
2. ✅ `@types/bcryptjs` ajouté aux `devDependencies`
3. ✅ Code commité et pushé sur Git

## 🎯 Prochaines Étapes

1. ⏳ Attendre le déploiement automatique Vercel (si GitHub connecté)
2. ⏳ Vérifier que le build réussit
3. ⏳ Vérifier que l'erreur 500 est résolue

## 📝 Note sur Root Directory

Vous avez correctement configuré le Root Directory sur `apps/frontend` dans Vercel. C'est la bonne configuration pour un monorepo.




