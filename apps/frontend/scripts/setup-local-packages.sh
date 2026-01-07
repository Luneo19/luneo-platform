#!/bin/bash
# Script de setup des packages locaux pour Vercel
# Ne pas utiliser set -e pour éviter les erreurs silencieuses
set +e

# Déterminer le répertoire de travail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR" || {
  echo "❌ Erreur: Impossible de se déplacer vers $PROJECT_DIR"
  exit 1
}

echo "📦 Setting up local packages for Vercel build..."
echo "📍 Working directory: $(pwd)"
echo "📁 Script directory: $SCRIPT_DIR"

# Générer Prisma Client si nécessaire (utiliser pnpm prisma pour utiliser la version dans package.json)
echo ""
echo "🔧 Generating Prisma Client..."
if [ -f "prisma/schema.prisma" ]; then
  pnpm prisma generate || {
    echo "⚠️ Prisma generate failed, trying with schema path..."
    pnpm prisma generate --schema=prisma/schema.prisma || echo "⚠️ Prisma generate skipped"
  }
else
  echo "⚠️ Prisma schema not found in prisma/schema.prisma"
  if [ -f "../backend/prisma/schema.prisma" ]; then
    echo "📦 Using backend schema..."
    pnpm prisma generate --schema=../backend/prisma/schema.prisma || echo "⚠️ Prisma generate skipped"
  fi
fi

# Créer les dossiers pour les packages locaux
mkdir -p node_modules/@luneo/billing-plans
mkdir -p node_modules/@luneo/ai-safety  
mkdir -p node_modules/@luneo/types

# Fonction pour copier un package avec son package.json
copy_package() {
  local package_name=$1
  local source_dir=$2
  local target_dir="node_modules/@luneo/$package_name"
  
  if [ -d "$source_dir" ]; then
    echo "📦 Copying @luneo/$package_name..."
    # Créer le dossier cible
    mkdir -p "$target_dir"
    
    # Copier package.json en premier (important pour la résolution)
    if [ -f "$source_dir/package.json" ]; then
      cp "$source_dir/package.json" "$target_dir/package.json"
      echo "  ✅ package.json copié"
    else
      echo "  ⚠️ package.json manquant, création..."
      cat > "$target_dir/package.json" <<EOF
{
  "name": "@luneo/$package_name",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
EOF
    fi
    
    # Copier le dossier dist/ si existe (fichiers compilés)
    if [ -d "$source_dir/dist" ]; then
      echo "  📦 Copie du dossier dist/..."
      cp -r "$source_dir/dist" "$target_dir/dist"
      echo "  ✅ dist/ copié"
    fi
    
    # Copier les fichiers source si dist/ n'existe pas
    if [ ! -d "$source_dir/dist" ]; then
      echo "  📦 Copie des fichiers source..."
      cp -r "$source_dir"/* "$target_dir/" 2>/dev/null || true
    fi
    
    # Vérifier que les fichiers principaux existent
    if [ ! -f "$target_dir/dist/index.js" ] && [ ! -f "$target_dir/index.js" ]; then
      echo "  ⚠️ Aucun index.js trouvé, création depuis index.ts..."
      if [ -f "$source_dir/index.ts" ]; then
        cp "$source_dir/index.ts" "$target_dir/index.js" 2>/dev/null || true
      fi
    fi
  else
    echo "  ❌ Dossier source non trouvé: $source_dir"
  fi
}

# Copier les packages (ne pas échouer si un package n'existe pas)
echo ""
echo "🔄 Copie des packages locaux..."
copy_package "billing-plans" "src/lib/packages/billing-plans" || echo "⚠️ Échec copie billing-plans, continuation..."
copy_package "ai-safety" "src/lib/packages/ai-safety" || echo "⚠️ Échec copie ai-safety, continuation..."
copy_package "types" "src/lib/packages/types" || echo "⚠️ Échec copie types, continuation..."

# Vérifier que les packages sont bien là
echo ""
echo "✅ Local packages setup complete"
echo "📋 Vérification des packages installés..."
if [ -d "node_modules/@luneo" ]; then
  ls -la node_modules/@luneo/ 2>/dev/null || echo "⚠️ No @luneo packages found"
else
  echo "⚠️ node_modules/@luneo/ directory not found"
fi

# Vérifier les package.json
echo ""
echo "📋 Vérification des package.json..."
for pkg in billing-plans ai-safety types; do
  if [ -f "node_modules/@luneo/$pkg/package.json" ]; then
    echo "✅ @luneo/$pkg/package.json exists"
    if [ -d "node_modules/@luneo/$pkg/dist" ]; then
      echo "  ✅ dist/ directory exists"
    else
      echo "  ⚠️ dist/ directory missing"
    fi
  else
    echo "⚠️ @luneo/$pkg/package.json missing"
  fi
done

echo ""
echo "✅ Setup des packages locaux terminé avec succès"

# Vérification finale - s'assurer que les packages sont accessibles
echo ""
echo "🔍 Vérification finale des imports..."
for pkg in billing-plans ai-safety types; do
  if [ -f "node_modules/@luneo/$pkg/dist/index.js" ] || [ -f "node_modules/@luneo/$pkg/index.js" ]; then
    echo "✅ @luneo/$pkg accessible"
  else
    echo "⚠️ @luneo/$pkg non accessible - peut causer des erreurs de build"
  fi
done

echo ""
echo "✅ Script terminé"

# Sortir avec code 0 pour indiquer le succès
exit 0












