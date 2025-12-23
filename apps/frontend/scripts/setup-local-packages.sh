#!/bin/bash
set -e

echo "📦 Setting up local packages for Vercel build..."

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

# Copier les packages
copy_package "billing-plans" "src/lib/packages/billing-plans"
copy_package "ai-safety" "src/lib/packages/ai-safety"
copy_package "types" "src/lib/packages/types"

# Vérifier que les packages sont bien là
echo "✅ Local packages setup complete"
ls -la node_modules/@luneo/ 2>/dev/null || echo "⚠️ No @luneo packages found"

# Vérifier les package.json
for pkg in billing-plans ai-safety types; do
  if [ -f "node_modules/@luneo/$pkg/package.json" ]; then
    echo "✅ @luneo/$pkg/package.json exists"
  else
    echo "⚠️ @luneo/$pkg/package.json missing"
  fi
done
