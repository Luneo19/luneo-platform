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
    # Copier tous les fichiers
    cp -r "$source_dir"/* "$target_dir/" 2>/dev/null || true
    
    # S'assurer que package.json existe
    if [ ! -f "$target_dir/package.json" ]; then
      echo "⚠️ package.json manquant pour @luneo/$package_name, création..."
      cat > "$target_dir/package.json" <<EOF
{
  "name": "@luneo/$package_name",
  "version": "1.0.0",
  "main": "index.js",
  "types": "index.d.ts"
}
EOF
    fi
    
    # Créer index.js si nécessaire (pour compatibilité)
    if [ ! -f "$target_dir/index.js" ] && [ -f "$target_dir/index.ts" ]; then
      echo "📝 Creating index.js from index.ts for @luneo/$package_name..."
      # Copier index.ts comme index.js (TypeScript sera compilé)
      cp "$target_dir/index.ts" "$target_dir/index.js" 2>/dev/null || true
    fi
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
