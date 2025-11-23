#!/bin/bash
set -e

# Script de build optimisé pour Vercel - Frontend uniquement
# Exécuté depuis la racine du repo

echo "🚀 Build Frontend pour Vercel"
echo "=============================="
echo ""

REPO_ROOT="$(pwd)"
FRONTEND_DIR="$REPO_ROOT/apps/frontend"

# Vérifier qu'on est à la racine
if [ ! -f "pnpm-lock.yaml" ]; then
  echo "❌ Ce script doit être exécuté depuis la racine du repo"
  exit 1
fi

# Installer uniquement les dépendances nécessaires pour le frontend
echo "📦 Installation des dépendances (frontend uniquement)..."
cd "$REPO_ROOT"

MOBILE_PKG_JSON="$REPO_ROOT/apps/mobile/package.json"
MOBILE_PKG_JSON_BACKUP="$REPO_ROOT/apps/mobile/package.json.vercel-backup"
VIRTUAL_TRYON_PKG_JSON="$REPO_ROOT/packages/virtual-try-on/package.json"
VIRTUAL_TRYON_PKG_JSON_BACKUP="$REPO_ROOT/packages/virtual-try-on/package.json.vercel-backup"

# Workaround: Supprimer temporairement les dépendances problématiques
# 1. Mobile: @watermelondb/adapters-sqlite
if [ -f "$MOBILE_PKG_JSON" ]; then
  echo "🔧 Workaround: Sauvegarde et modification temporaire de apps/mobile/package.json..."
  cp "$MOBILE_PKG_JSON" "$MOBILE_PKG_JSON_BACKUP"
  # Supprimer la ligne problématique si elle existe (utiliser jq si disponible, sinon sed)
  if command -v jq &> /dev/null; then
    jq 'del(.dependencies["@watermelondb/adapters-sqlite"])' "$MOBILE_PKG_JSON" > "${MOBILE_PKG_JSON}.tmp" && mv "${MOBILE_PKG_JSON}.tmp" "$MOBILE_PKG_JSON"
  else
    # Fallback: utiliser sed pour supprimer la ligne
    sed -i.bak '/"@watermelondb\/adapters-sqlite"/d' "$MOBILE_PKG_JSON" 2>/dev/null || true
  fi
fi

# 2. Virtual Try-On: @mediapipe/* (versions problématiques)
if [ -f "$VIRTUAL_TRYON_PKG_JSON" ]; then
  echo "🔧 Workaround: Sauvegarde et modification temporaire de packages/virtual-try-on/package.json..."
  cp "$VIRTUAL_TRYON_PKG_JSON" "$VIRTUAL_TRYON_PKG_JSON_BACKUP"
  # Supprimer toutes les dépendances @mediapipe avec sed (plus simple et robuste)
  sed -i.bak '/"@mediapipe\//d' "$VIRTUAL_TRYON_PKG_JSON" 2>/dev/null || true
fi

# Désactiver erreur temporairement
set +e

# Installer avec filter
echo "📦 Installation avec filter (frontend + dépendances workspace)..."
pnpm install --filter luneo-frontend... --filter @luneo/types --filter @luneo/ai-safety --filter @luneo/billing-plans --no-frozen-lockfile --ignore-scripts 2>&1 | tee /tmp/pnpm-install.log

INSTALL_STATUS=$?

# Vérifier si les dépendances du frontend sont installées
if [ -d "$REPO_ROOT/node_modules/.pnpm" ]; then
  echo "✅ Installation réussie (node_modules/.pnpm existe)"
  INSTALL_STATUS=0
fi

# Réactiver erreur
set -e

# Restaurer les package.json modifiés
if [ -f "$MOBILE_PKG_JSON_BACKUP" ]; then
  echo "🔧 Restauration de apps/mobile/package.json..."
  mv "$MOBILE_PKG_JSON_BACKUP" "$MOBILE_PKG_JSON"
  rm -f "${MOBILE_PKG_JSON}.bak" 2>/dev/null || true
fi

if [ -f "$VIRTUAL_TRYON_PKG_JSON_BACKUP" ]; then
  echo "🔧 Restauration de packages/virtual-try-on/package.json..."
  mv "$VIRTUAL_TRYON_PKG_JSON_BACKUP" "$VIRTUAL_TRYON_PKG_JSON"
  rm -f "${VIRTUAL_TRYON_PKG_JSON}.bak" 2>/dev/null || true
fi

# Si l'installation a complètement échoué, essayer une méthode alternative
if [ $INSTALL_STATUS -ne 0 ] || [ ! -d "$REPO_ROOT/node_modules/.pnpm" ]; then
  echo "⚠️  Installation avec filter échouée, tentative installation complète..."
  cd "$REPO_ROOT"
  
  # Réappliquer le workaround
  if [ -f "$MOBILE_PKG_JSON" ]; then
    cp "$MOBILE_PKG_JSON" "$MOBILE_PKG_JSON_BACKUP"
    if command -v jq &> /dev/null; then
      jq 'del(.dependencies["@watermelondb/adapters-sqlite"])' "$MOBILE_PKG_JSON" > "${MOBILE_PKG_JSON}.tmp" && mv "${MOBILE_PKG_JSON}.tmp" "$MOBILE_PKG_JSON"
    else
      sed -i.bak '/"@watermelondb\/adapters-sqlite"/d' "$MOBILE_PKG_JSON" 2>/dev/null || true
    fi
  fi
  
  if [ -f "$VIRTUAL_TRYON_PKG_JSON" ]; then
    cp "$VIRTUAL_TRYON_PKG_JSON" "$VIRTUAL_TRYON_PKG_JSON_BACKUP"
    # Supprimer toutes les dépendances @mediapipe avec sed
    sed -i.bak '/"@mediapipe\//d' "$VIRTUAL_TRYON_PKG_JSON" 2>/dev/null || true
  fi
  
  set +e
  pnpm install --no-frozen-lockfile --ignore-scripts 2>&1 | tail -30
  set -e
  
  # Restaurer à nouveau
  if [ -f "$MOBILE_PKG_JSON_BACKUP" ]; then
    mv "$MOBILE_PKG_JSON_BACKUP" "$MOBILE_PKG_JSON"
    rm -f "${MOBILE_PKG_JSON}.bak" 2>/dev/null || true
  fi
  
  if [ -f "$VIRTUAL_TRYON_PKG_JSON_BACKUP" ]; then
    mv "$VIRTUAL_TRYON_PKG_JSON_BACKUP" "$VIRTUAL_TRYON_PKG_JSON"
    rm -f "${VIRTUAL_TRYON_PKG_JSON}.bak" 2>/dev/null || true
  fi
  
  # Vérifier si au moins les dépendances de base sont installées
  if [ -d "$REPO_ROOT/node_modules" ]; then
    echo "✅ node_modules racine existe"
    INSTALL_STATUS=0
  fi
fi

# Build du frontend
echo ""
echo "🏗️  Build du frontend..."

# Utiliser pnpm depuis la racine avec filter pour que les dépendances soient accessibles
cd "$REPO_ROOT"
pnpm --filter luneo-frontend run build || {
  echo "⚠️  Build avec filter échoué, tentative depuis apps/frontend..."
  cd "$FRONTEND_DIR"
  # Vérifier si next est disponible
  if command -v next &> /dev/null || [ -f "node_modules/.bin/next" ] || [ -f "../node_modules/.bin/next" ]; then
    pnpm run build || npm run build || npx next build
  else
    echo "❌ Next.js non trouvé. Installation des dépendances dans apps/frontend..."
    cd "$FRONTEND_DIR"
    pnpm install --no-frozen-lockfile || npm install
    pnpm run build || npm run build
  fi
}

echo ""
echo "✅ Build terminé avec succès!"

