# 🐳 OPTIMISATION DOCKERFILE - RÉDUCTION TAILLE IMAGE

**Date**: 11 Janvier 2026  
**Problème**: Image Docker de 4.5 GB dépasse la limite Railway de 4.0 GB  
**Solution**: Build multi-stage avec Alpine Linux

---

## 🎯 OBJECTIF

Réduire la taille de l'image Docker de **4.5 GB** à **< 4.0 GB** pour respecter la limite Railway.

---

## ✅ OPTIMISATIONS APPLIQUÉES

### 1. Build Multi-Stage ✅

**Avant** : Une seule étape avec toutes les dépendances  
**Après** : Deux étapes séparées
- **Stage 1 (builder)** : Compile l'application avec devDependencies
- **Stage 2 (production)** : Image finale légère avec uniquement les fichiers nécessaires

### 2. Image Alpine ✅

**Avant** : `node:20` (~900 MB)  
**Après** : `node:20-alpine` (~150 MB)

**Réduction** : ~750 MB

### 3. Dépendances de Production Uniquement ✅

**Stage 2** : Installation uniquement des dépendances de production
```dockerfile
RUN pnpm install --frozen-lockfile --include-workspace-root --prod --filter=backend
```

**Réduction** : ~1-2 GB (selon le nombre de devDependencies)

### 4. Nettoyage des Fichiers Inutiles ✅

Suppression automatique de :
- Fichiers de test (`*.test.ts`, `*.spec.ts`)
- Documentation (`*.md`)
- Source maps (`*.map`)
- Cache (`node_modules/.cache`)
- Fichiers temporaires

**Réduction** : ~200-500 MB

### 5. .dockerignore Optimisé ✅

Exclusion de :
- Frontend (`apps/frontend/`)
- Tests (`**/test/`, `**/__tests__/`)
- Documentation (`*.md`, `docs/`)
- Cache (`.cache/`, `.next/`)
- Scripts de déploiement

**Réduction** : ~100-300 MB

---

## 📊 RÉDUCTION ATTENDUE

| Élément | Avant | Après | Réduction |
|---------|-------|-------|-----------|
| Image de base | ~900 MB | ~150 MB | **-750 MB** |
| DevDependencies | ~1-2 GB | 0 MB | **-1-2 GB** |
| Fichiers inutiles | ~500 MB | ~50 MB | **-450 MB** |
| **TOTAL** | **4.5 GB** | **~1.5-2.0 GB** | **-2.5-3.0 GB** |

---

## 🚀 DÉPLOIEMENT

Les modifications ont été commitées et pushées. Railway va automatiquement :
1. Détecter le nouveau Dockerfile
2. Lancer un nouveau build avec l'image optimisée
3. Vérifier que la taille est < 4.0 GB

---

## ⚠️ NOTES IMPORTANTES

### Prisma Client

Le Prisma Client est copié depuis le stage builder car il est généré pendant le build :
```dockerfile
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
```

### Script de Démarrage

Le script `/app/start.sh` reste identique et exécute :
1. Migrations Prisma
2. Démarrage de l'application

### Packages

Les packages partagés sont copiés si nécessaires par le backend. Si certains packages ne sont pas utilisés, ils peuvent être exclus du `.dockerignore`.

---

## 🔍 VÉRIFICATION

Après le déploiement, vérifier dans Railway :
- ✅ Build réussi
- ✅ Taille de l'image < 4.0 GB
- ✅ Application démarre correctement
- ✅ Migrations Prisma appliquées

---

**Document créé le** : 11 Janvier 2026  
**Dernière mise à jour** : 11 Janvier 2026
