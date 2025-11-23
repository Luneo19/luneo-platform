#!/bin/bash
set -e

# Script de build pour Vercel avec monorepo
# Vercel exécute ce script depuis le Root Directory (apps/frontend) OU depuis la racine

REPO_ROOT="$(pwd)"
if [ -f "pnpm-lock.yaml" ]; then
  # On est à la racine
  REPO_ROOT="$(pwd)"
  FRONTEND_DIR="$REPO_ROOT/apps/frontend"
else
  # On est dans apps/frontend, remonter
  REPO_ROOT="$(cd ../.. && pwd)"
  FRONTEND_DIR="$(pwd)"
fi

# Workaround: Gérer les dépendances problématiques
MOBILE_PKG_JSON="$REPO_ROOT/apps/mobile/package.json"
MOBILE_PKG_JSON_BACKUP="$REPO_ROOT/apps/mobile/package.json.vercel-backup"
VIRTUAL_TRY_ON_PKG_JSON="$REPO_ROOT/packages/virtual-try-on/package.json"
VIRTUAL_TRY_ON_PKG_JSON_BACKUP="$REPO_ROOT/packages/virtual-try-on/package.json.vercel-backup"

if [ -f "$MOBILE_PKG_JSON" ]; then
  echo "🔧 Workaround: Modification temporaire de apps/mobile/package.json..."
  cp "$MOBILE_PKG_JSON" "$MOBILE_PKG_JSON_BACKUP"
  if command -v jq &> /dev/null; then
    jq 'del(.dependencies["@watermelondb/adapters-sqlite"])' "$MOBILE_PKG_JSON" > "${MOBILE_PKG_JSON}.tmp" && mv "${MOBILE_PKG_JSON}.tmp" "$MOBILE_PKG_JSON"
  else
    sed -i.bak '/"@watermelondb\/adapters-sqlite"/d' "$MOBILE_PKG_JSON" 2>/dev/null || true
  fi
fi

if [ -f "$VIRTUAL_TRY_ON_PKG_JSON" ]; then
  echo "🔧 Workaround: Modification temporaire de packages/virtual-try-on/package.json..."
  cp "$VIRTUAL_TRY_ON_PKG_JSON" "$VIRTUAL_TRY_ON_PKG_JSON_BACKUP"
  # Supprimer toutes les dépendances @mediapipe avec sed (plus simple et robuste)
  sed -i.bak '/"@mediapipe\//d' "$VIRTUAL_TRY_ON_PKG_JSON" 2>/dev/null || true
fi

# Remonter à la racine du monorepo
cd "$REPO_ROOT"

echo "📦 Installation depuis la racine du monorepo..."
set +e
# Installer avec toutes les dépendances (y compris dev) pour le frontend
pnpm install --no-frozen-lockfile --ignore-scripts --filter luneo-frontend... 2>&1 | grep -v "apps/mobile" | tail -30 || {
  echo "⚠️  Installation avec filter échouée, tentative complète..."
  pnpm install --no-frozen-lockfile --ignore-scripts 2>&1 | grep -v "apps/mobile" | tail -30
}
INSTALL_STATUS=$?
set -e

# Restaurer les fichiers modifiés
if [ -f "$MOBILE_PKG_JSON_BACKUP" ]; then
  mv "$MOBILE_PKG_JSON_BACKUP" "$MOBILE_PKG_JSON"
  rm -f "${MOBILE_PKG_JSON}.bak" 2>/dev/null || true
fi

if [ -f "$VIRTUAL_TRY_ON_PKG_JSON_BACKUP" ]; then
  mv "$VIRTUAL_TRY_ON_PKG_JSON_BACKUP" "$VIRTUAL_TRY_ON_PKG_JSON"
  rm -f "${VIRTUAL_TRY_ON_PKG_JSON}.bak" 2>/dev/null || true
fi

# Vérifier si l'installation a réussi
if [ $INSTALL_STATUS -ne 0 ] && [ ! -d "$REPO_ROOT/node_modules/.pnpm" ]; then
  echo "⚠️  Installation échouée, mais on continue..."
fi

echo "🏗️  Build du frontend..."

# Vérifier si next est disponible dans node_modules racine
cd "$REPO_ROOT"
NEXT_BIN="$REPO_ROOT/node_modules/.bin/next"
NEXT_MODULE="$REPO_ROOT/node_modules/next"

if [ -f "$NEXT_BIN" ] || [ -d "$NEXT_MODULE" ]; then
  echo "✅ Next.js trouvé dans node_modules racine"
  cd "$FRONTEND_DIR"
  # Utiliser le chemin complet vers next avec NODE_PATH pour résoudre les modules
  export NODE_PATH="$REPO_ROOT/node_modules:$NODE_PATH"
  "$NEXT_BIN" build || {
    echo "⚠️  Build avec chemin complet échoué, tentative avec pnpm exec..."
    cd "$REPO_ROOT"
    pnpm --filter luneo-frontend exec next build
  }
else
  echo "⚠️  Next.js non trouvé, vérification de l'installation..."
  # Vérifier si l'installation a vraiment réussi malgré les erreurs
  if [ -d "$REPO_ROOT/node_modules/.pnpm" ]; then
    echo "📦 node_modules/.pnpm existe, recherche de next..."
    # Chercher next dans .pnpm
    NEXT_PNPM=$(find "$REPO_ROOT/node_modules/.pnpm" -name "next" -type d | head -1)
    if [ -n "$NEXT_PNPM" ]; then
      echo "✅ Next.js trouvé dans .pnpm: $NEXT_PNPM"
      cd "$FRONTEND_DIR"
      export NODE_PATH="$REPO_ROOT/node_modules:$NODE_PATH"
      # Utiliser npx avec le chemin vers node_modules
      npx --yes next build
    else
      echo "❌ Next.js non trouvé, échec du build"
      exit 1
    fi
  else
    echo "❌ Installation échouée, node_modules/.pnpm n'existe pas"
    exit 1
  fi
fi
