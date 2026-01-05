# ✅ Correction Configuration Vercel - Monorepo

**Date** : 5 janvier 2026, 01:30

## 🔍 Problème Identifié

Dans un monorepo pnpm avec Root Directory `apps/frontend` :
- **Installation** : Doit se faire depuis la racine du monorepo (où se trouve `pnpm-lock.yaml`)
- **Build** : Doit se faire depuis `apps/frontend` (où se trouve `package.json` du frontend)

## ✅ Solution Appliquée

### Configuration `vercel.json`

**Avant** :
```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "(pnpm prisma generate || echo 'Prisma skipped') && pnpm run build"
}
```

**Après** :
```json
{
  "installCommand": "cd ../.. && pnpm install --no-frozen-lockfile",
  "buildCommand": "cd apps/frontend && (pnpm prisma generate || echo 'Prisma skipped') && pnpm run build"
}
```

## 📋 Explication

### Install Command
- `cd ../..` : Remonter à la racine du monorepo depuis `apps/frontend`
- `pnpm install --no-frozen-lockfile` : Installer toutes les dépendances du monorepo

### Build Command
- `cd apps/frontend` : Aller dans le répertoire du frontend
- `pnpm prisma generate` : Générer Prisma Client
- `pnpm run build` : Builder Next.js

## 🎯 Configuration Vercel Dashboard

**Root Directory** : `apps/frontend` ✅

Cette configuration est correcte car :
- Vercel sait où se trouve le Next.js app
- Les commandes dans `vercel.json` gèrent le changement de répertoire

## 📝 Commits

- `0e6e3ef` - fix: corriger installCommand pour monorepo pnpm avec Root Directory apps/frontend
- `[en cours]` - fix: corriger buildCommand pour monorepo pnpm - exécuter depuis apps/frontend

