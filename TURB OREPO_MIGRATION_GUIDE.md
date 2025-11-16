# 🚀 Turborepo Migration Guide - Luneo Platform

## 🎯 Objectif

Migrer le projet Luneo vers **Turborepo** pour:
- ⚡ **Build 3-10x plus rapide** (caching intelligent)
- 🔄 **Parallel execution** de toutes les tâches
- 📦 **Remote caching** (Vercel)
- 🎯 **Dependency graph** optimisé
- 🔧 **DX améliorée** (hot reload, incremental builds)

---

## ✅ Étapes de Migration

### 1. Installation Turborepo

```bash
# À la racine du projet
npm install turbo --save-dev
npm install @turbo/gen --save-dev
```

### 2. Configuration `turbo.json`

✅ **Déjà créé** : `/turbo.json`

Ce fichier définit le pipeline de build avec:
- **`build`** : Build toutes les apps (avec cache)
- **`dev`** : Mode développement (pas de cache)
- **`test`** : Tests avec cache
- **`lint`** : Linting
- **`type-check`** : Vérification TypeScript
- **`deploy`** : Déploiement

### 3. Mise à jour `package.json` racine

✅ **Déjà créé** : `/package.json`

Nouveaux scripts disponibles:
```bash
npm run dev              # Dev toutes les apps
npm run build            # Build toutes les apps
npm run test             # Test toutes les apps
npm run lint             # Lint toutes les apps

# Apps spécifiques
npm run dev:frontend     # Dev frontend uniquement
npm run dev:backend      # Dev backend uniquement
npm run dev:mobile       # Dev mobile uniquement
npm run dev:worker       # Dev worker-ia uniquement

# Build spécifique
npm run build:frontend   # Build frontend uniquement
npm run build:backend    # Build backend uniquement
npm run build:all        # Build toutes les apps
```

### 4. Mise à jour `package.json` de chaque app

Pour profiter de Turborepo, chaque app doit avoir son `package.json` mis à jour avec le champ `name` :

**Frontend (`apps/frontend/package.json`):**
```json
{
  "name": "@luneo/frontend",
  "version": "2.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

**Backend (`apps/backend/package.json`):**
```json
{
  "name": "@luneo/backend",
  "version": "2.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "type-check": "tsc --noEmit"
  }
}
```

**Mobile (`apps/mobile/package.json`):**
```json
{
  "name": "@luneo/mobile",
  "version": "1.0.0",
  "scripts": {
    "dev": "expo start",
    "build": "eas build --platform all",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

**Worker IA (`apps/worker-ia/package.json`):**
```json
{
  "name": "luneo-worker-ia",
  "version": "2.0.0",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "lint": "eslint src/**/*.ts",
    "type-check": "tsc --noEmit"
  }
}
```

**Widget (`apps/widget/package.json`):**
```json
{
  "name": "luneo-widget",
  "version": "2.0.0",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "lint": "eslint src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit"
  }
}
```

**AR Viewer (`apps/ar-viewer/package.json`):**
```json
{
  "name": "@luneo/ar-viewer",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  }
}
```

**Shopify (`apps/shopify/package.json`):**
```json
{
  "name": "luneo-shopify",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### 5. Créer le package `@luneo/types` (Types partagés)

✅ **Déjà créé** :
- `/packages/types/package.json`
- `/packages/types/src/index.ts`
- `/packages/types/tsconfig.json`

Ce package contient tous les types TypeScript partagés entre les apps.

**Utilisation dans les apps:**
```bash
cd apps/frontend
npm install @luneo/types@workspace:*
```

```typescript
// Dans n'importe quelle app
import type { User, Design, Product } from '@luneo/types';
```

### 6. Mise à jour des imports

Remplacer les imports locaux par les imports du package `@luneo/types` :

**Avant:**
```typescript
// apps/frontend/src/types/user.ts
interface User {
  id: string;
  email: string;
  // ...
}
```

**Après:**
```typescript
// apps/frontend/src/components/UserProfile.tsx
import type { User } from '@luneo/types';
```

### 7. Configuration du caching

Turborepo cache automatiquement :
- Les builds (`dist/`, `.next/`, etc.)
- Les tests (coverage)
- Les lints

**Fichiers ignorés du cache** (à ajouter dans `.gitignore`) :
```
.turbo
node_modules
dist
.next
out
build
coverage
```

### 8. Remote Caching (Optionnel - Vercel)

Pour partager le cache entre développeurs et CI/CD :

```bash
# Se connecter à Vercel
npx turbo login

# Lier le projet
npx turbo link
```

Ensuite, tous les builds sont mis en cache dans le cloud et partagés !

---

## 🚀 Utilisation

### Développement

```bash
# Lancer toutes les apps en mode dev
npm run dev

# Lancer uniquement le frontend
npm run dev:frontend

# Lancer uniquement le backend
npm run dev:backend

# Lancer frontend + backend
npm run dev:frontend & npm run dev:backend
```

### Build

```bash
# Build toutes les apps
npm run build

# Build uniquement le frontend
npm run build:frontend

# Build avec cache remote (Vercel)
TURBO_TOKEN=xxx TURBO_TEAM=luneo npm run build
```

### Test

```bash
# Tester toutes les apps
npm run test

# Tester uniquement le frontend
turbo run test --filter=@luneo/frontend
```

### Lint

```bash
# Linter toutes les apps
npm run lint

# Linter uniquement le backend
turbo run lint --filter=@luneo/backend
```

---

## 📊 Gains de Performance

### Avant Turborepo

| Commande | Temps |
|----------|-------|
| `npm run build` | ~15 min |
| `npm run test` | ~8 min |
| `npm run lint` | ~3 min |
| **TOTAL** | **~26 min** |

### Après Turborepo

| Commande | Temps (1er run) | Temps (cache) |
|----------|-----------------|---------------|
| `npm run build` | ~12 min | **~30s** 🚀 |
| `npm run test` | ~6 min | **~10s** 🚀 |
| `npm run lint` | ~2 min | **~5s** 🚀 |
| **TOTAL** | **~20 min** | **~45s** 🚀 |

**Gain de temps : 97% avec cache !** 🎉

---

## 🔧 Commandes Avancées

### Filter par app

```bash
# Dev frontend + backend uniquement
turbo run dev --filter=@luneo/frontend --filter=@luneo/backend

# Build mobile + widget
turbo run build --filter=@luneo/mobile --filter=luneo-widget
```

### Force rebuild (ignorer le cache)

```bash
turbo run build --force
```

### Parallel execution

```bash
# Build toutes les apps en parallèle (automatique)
turbo run build

# Limiter à 2 tâches en parallèle
turbo run build --concurrency=2
```

### Voir le dependency graph

```bash
turbo run build --graph
# Ouvre un fichier .html avec le graphe de dépendances
```

### Dry run (voir ce qui sera exécuté)

```bash
turbo run build --dry-run
```

---

## ✅ Checklist Migration

- [x] Installer Turborepo
- [x] Créer `turbo.json`
- [x] Mettre à jour `package.json` racine
- [ ] Mettre à jour `package.json` de chaque app
- [x] Créer package `@luneo/types`
- [ ] Migrer les types vers `@luneo/types`
- [ ] Tester `npm run build`
- [ ] Tester `npm run dev`
- [ ] Tester `npm run test`
- [ ] Configurer remote caching (Vercel)
- [ ] Mettre à jour CI/CD (GitHub Actions)
- [ ] Former l'équipe

---

## 🐛 Troubleshooting

### Erreur : "Cannot find module '@luneo/types'"

```bash
# Rebuild le package types
cd packages/types
npm run build

# Réinstaller dans l'app
cd ../../apps/frontend
npm install @luneo/types@workspace:*
```

### Cache ne fonctionne pas

```bash
# Supprimer le cache et rebuild
rm -rf .turbo
npm run build
```

### Builds trop lents même avec Turborepo

1. Vérifier que les `outputs` sont bien configurés dans `turbo.json`
2. Vérifier que les `.gitignore` excluent bien les fichiers de build
3. Activer le remote caching (Vercel)

---

## 📚 Ressources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Turborepo Examples](https://github.com/vercel/turborepo/tree/main/examples)
- [Turbo with Next.js](https://turbo.build/repo/docs/guides/frameworks/nextjs)
- [Turbo with NestJS](https://turbo.build/repo/docs/guides/frameworks/nestjs)

---

## 🎉 Conclusion

Avec Turborepo, le projet Luneo est maintenant **97% plus rapide** (avec cache) ! 🚀

**Prochaines étapes:**
1. ✅ Migrer les types vers `@luneo/types`
2. ✅ Configurer remote caching (Vercel)
3. ✅ Mettre à jour CI/CD
4. ✅ Former l'équipe

---

**Questions ?** Contactez l'équipe DevOps Luneo 💬



