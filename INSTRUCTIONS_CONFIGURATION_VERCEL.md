# 📋 Instructions Configuration Vercel - Monorepo

**Date** : 5 janvier 2026, 01:35

## ⚠️ Problème Identifié

Avec **Root Directory = `apps/frontend`** :
- Vercel ne copie que le contenu de `apps/frontend`
- Le `pnpm-lock.yaml` à la racine n'est pas disponible
- L'installation pnpm échoue car elle ne trouve pas le lockfile

## ✅ Solution Recommandée

### Option 1 : Root Directory = `.` (Racine) - RECOMMANDÉ

**Configuration Vercel Dashboard** :
- **Root Directory** : `.` (racine du monorepo)
- **Build Command** : `cd apps/frontend && (pnpm prisma generate || echo 'Prisma skipped') && pnpm run build`
- **Install Command** : `pnpm install --no-frozen-lockfile`

**Avantages** :
- ✅ `pnpm-lock.yaml` disponible
- ✅ Installation monorepo fonctionne correctement
- ✅ Toutes les dépendances partagées disponibles

### Option 2 : Root Directory = `apps/frontend` (Actuel)

**Configuration Vercel Dashboard** :
- **Root Directory** : `apps/frontend`
- **Build Command** : `(pnpm prisma generate || echo 'Prisma skipped') && pnpm run build`
- **Install Command** : `pnpm install --no-frozen-lockfile`

**Problème** :
- ❌ `pnpm-lock.yaml` à la racine n'est pas disponible
- ❌ Installation peut échouer

**Solution** : Copier `pnpm-lock.yaml` dans `apps/frontend` (non recommandé)

## 🎯 Action Immédiate

**Changer Root Directory dans Vercel Dashboard** :
1. Aller sur : https://vercel.com/luneos-projects/frontend/settings/general
2. Section **"Root Directory"**
3. Changer de `apps/frontend` à `.` (point)
4. Sauvegarder

**Puis mettre à jour `vercel.json`** :
```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "cd apps/frontend && (pnpm prisma generate || echo 'Prisma skipped') && pnpm run build"
}
```

## 📝 Note

Le `vercel.json` a été mis à jour avec le `buildCommand` correct. Il faut maintenant changer le Root Directory dans le Dashboard Vercel de `apps/frontend` à `.` (racine).

