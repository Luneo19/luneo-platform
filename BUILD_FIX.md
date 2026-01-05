# 🔧 RÉSOLUTION PROBLÈME BUILD

## Problème

```
Error: Cannot find module '@nestjs/cli/bin/nest.js'
```

## Solution

### Option 1 : Réinstaller dépendances

```bash
# À la racine du monorepo
cd /Users/emmanuelabougadous/luneo-platform
rm -rf node_modules
pnpm install
```

### Option 2 : Installer NestJS CLI localement

```bash
cd apps/backend
pnpm add -D @nestjs/cli
pnpm run build
```

### Option 3 : Utiliser npx

```bash
cd apps/backend
npx @nestjs/cli build
```

### Option 4 : Vérifier pnpm workspace

```bash
# Vérifier que le workspace est bien configuré
cat package.json | grep workspaces

# Réinstaller depuis la racine
cd /Users/emmanuelabougadous/luneo-platform
pnpm install --force
```

## Vérification

```bash
# Vérifier que NestJS CLI est installé
cd apps/backend
pnpm list @nestjs/cli

# Ou utiliser directement depuis node_modules
./node_modules/.bin/nest build
```

## Alternative : Build TypeScript directement

```bash
cd apps/backend
npx tsc -p tsconfig.json
```

---

**Une fois le build réussi, suivre DEPLOYMENT_GUIDE.md pour le déploiement.**








