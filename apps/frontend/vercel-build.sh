#!/bin/bash
set -e

echo "🚀 Starting Vercel build for frontend..."

# Déterminer où nous sommes
CURRENT_DIR="$(pwd)"
echo "📍 Current directory: $CURRENT_DIR"

if [ -f "pnpm-lock.yaml" ]; then
  REPO_ROOT="$(pwd)"
  FRONTEND_DIR="$REPO_ROOT/apps/frontend"
else
  REPO_ROOT="$(cd ../.. && pwd)"
  FRONTEND_DIR="$(pwd)"
fi

echo "📁 Repo root: $REPO_ROOT"
echo "📁 Frontend dir: $FRONTEND_DIR"

# Installer pnpm 8 si nécessaire
echo "📦 Checking pnpm version..."
if ! command -v pnpm &> /dev/null || [[ $(pnpm -v | cut -d. -f1) -lt 8 ]]; then
  echo "📦 Installing pnpm 8..."
  npm install -g pnpm@8
fi
echo "✅ pnpm version: $(pnpm -v)"

# Workaround: Gérer les dépendances problématiques
MOBILE_PKG_JSON="$REPO_ROOT/apps/mobile/package.json"
MOBILE_PKG_JSON_BACKUP="$REPO_ROOT/apps/mobile/package.json.vercel-backup"
VIRTUAL_TRY_ON_PKG_JSON="$REPO_ROOT/packages/virtual-try-on/package.json"
VIRTUAL_TRY_ON_PKG_JSON_BACKUP="$REPO_ROOT/packages/virtual-try-on/package.json.vercel-backup"

if [ -f "$MOBILE_PKG_JSON" ]; then
  echo "🔧 Workaround: Removing @watermelondb from mobile..."
  cp "$MOBILE_PKG_JSON" "$MOBILE_PKG_JSON_BACKUP"
  sed -i.bak '/"@watermelondb\/adapters-sqlite"/d' "$MOBILE_PKG_JSON" 2>/dev/null || true
fi

if [ -f "$VIRTUAL_TRY_ON_PKG_JSON" ]; then
  echo "🔧 Workaround: Removing @mediapipe from virtual-try-on..."
  cp "$VIRTUAL_TRY_ON_PKG_JSON" "$VIRTUAL_TRY_ON_PKG_JSON_BACKUP"
  sed -i.bak '/"@mediapipe\//d' "$VIRTUAL_TRY_ON_PKG_JSON" 2>/dev/null || true
fi

# Installer les dépendances depuis la racine
cd "$REPO_ROOT"
echo "📦 Installing dependencies from monorepo root..."
set +e
pnpm install --no-frozen-lockfile --ignore-scripts 2>&1 | tail -50
INSTALL_STATUS=$?
set -e

# Restaurer les fichiers
if [ -f "$MOBILE_PKG_JSON_BACKUP" ]; then
  mv "$MOBILE_PKG_JSON_BACKUP" "$MOBILE_PKG_JSON"
  rm -f "${MOBILE_PKG_JSON}.bak" 2>/dev/null || true
fi

if [ -f "$VIRTUAL_TRY_ON_PKG_JSON_BACKUP" ]; then
  mv "$VIRTUAL_TRY_ON_PKG_JSON_BACKUP" "$VIRTUAL_TRY_ON_PKG_JSON"
  rm -f "${VIRTUAL_TRY_ON_PKG_JSON}.bak" 2>/dev/null || true
fi

# Build Next.js
echo "🏗️  Building frontend..."
cd "$FRONTEND_DIR"

# Exporter NODE_PATH pour résoudre les modules depuis node_modules racine
export NODE_PATH="$REPO_ROOT/node_modules:$NODE_PATH"

# Utiliser next depuis node_modules
if [ -f "$REPO_ROOT/node_modules/.bin/next" ]; then
  echo "✅ Using next from root node_modules"
  "$REPO_ROOT/node_modules/.bin/next" build
elif [ -f "./node_modules/.bin/next" ]; then
  echo "✅ Using next from local node_modules"
  ./node_modules/.bin/next build
else
  echo "✅ Using npx next"
  npx --yes next build
fi

echo "✅ Build completed successfully!"
