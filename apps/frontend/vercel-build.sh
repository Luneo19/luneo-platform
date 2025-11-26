#!/bin/bash
set -e

echo "🚀 Starting Vercel build for frontend..."

# Sur Vercel, le projet est déployé dans /vercel/path0 qui correspond à apps/frontend
CURRENT_DIR="$(pwd)"
echo "📍 Current directory: $CURRENT_DIR"

# Déterminer la racine du monorepo
if [ -f "../../pnpm-lock.yaml" ]; then
  # On est dans apps/frontend, la racine est deux niveaux au-dessus
  REPO_ROOT="$(cd ../.. && pwd)"
  FRONTEND_DIR="$CURRENT_DIR"
elif [ -f "pnpm-lock.yaml" ]; then
  # On est à la racine
  REPO_ROOT="$CURRENT_DIR"
  FRONTEND_DIR="$CURRENT_DIR/apps/frontend"
else
  # Sur Vercel, seul apps/frontend est uploadé
  # On traite apps/frontend comme la racine pour l'installation
  echo "📦 Mode standalone: Vercel deployment"
  REPO_ROOT="$CURRENT_DIR"
  FRONTEND_DIR="$CURRENT_DIR"
fi

echo "📁 Repo root: $REPO_ROOT"
echo "📁 Frontend dir: $FRONTEND_DIR"

# Installer pnpm 8 globalement
echo "📦 Installing pnpm@8 globally..."
npm install -g pnpm@8.15.9
echo "✅ pnpm version: $(pnpm -v)"

# Aller à la racine pour l'installation
cd "$REPO_ROOT"
echo "📦 Installing dependencies..."

# Sur Vercel en mode standalone, installer localement
if [ "$REPO_ROOT" = "$FRONTEND_DIR" ]; then
  echo "📦 Installing frontend dependencies only..."
  pnpm install --no-frozen-lockfile 2>&1 | tail -30
else
  # Mode monorepo complet
  # Workaround: Gérer les dépendances problématiques
  MOBILE_PKG_JSON="$REPO_ROOT/apps/mobile/package.json"
  if [ -f "$MOBILE_PKG_JSON" ]; then
    echo "🔧 Workaround: Removing @watermelondb from mobile..."
    sed -i.bak '/"@watermelondb\/adapters-sqlite"/d' "$MOBILE_PKG_JSON" 2>/dev/null || true
  fi

  VIRTUAL_TRY_ON_PKG_JSON="$REPO_ROOT/packages/virtual-try-on/package.json"
  if [ -f "$VIRTUAL_TRY_ON_PKG_JSON" ]; then
    echo "🔧 Workaround: Removing @mediapipe from virtual-try-on..."
    sed -i.bak '/"@mediapipe\//d' "$VIRTUAL_TRY_ON_PKG_JSON" 2>/dev/null || true
  fi

  pnpm install --no-frozen-lockfile 2>&1 | tail -50
fi

# Build Next.js
echo "🏗️  Building frontend..."
cd "$FRONTEND_DIR"

# Exporter NODE_PATH pour résoudre les modules
export NODE_PATH="$REPO_ROOT/node_modules:$FRONTEND_DIR/node_modules:$NODE_PATH"

# Utiliser next depuis node_modules
if [ -f "$FRONTEND_DIR/node_modules/.bin/next" ]; then
  echo "✅ Using next from local node_modules"
  ./node_modules/.bin/next build
elif [ -f "$REPO_ROOT/node_modules/.bin/next" ]; then
  echo "✅ Using next from repo root node_modules"
  "$REPO_ROOT/node_modules/.bin/next" build
else
  echo "✅ Using npx next"
  npx --yes next@15 build
fi

echo "✅ Build completed successfully!"
