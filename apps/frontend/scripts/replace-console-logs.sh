#!/bin/bash

# Script pour remplacer tous les console.log par logger
# Usage: ./scripts/replace-console-logs.sh

echo "🔍 Recherche des console.log dans le projet..."

# Trouver tous les fichiers avec console.log/error/warn
FILES=$(grep -rl "console\.\(log\|error\|warn\)" src/app src/components --include="*.tsx" --include="*.ts" | grep -v node_modules)

echo "📁 Fichiers trouvés: $(echo "$FILES" | wc -l)"

# Liste des fichiers à traiter
echo "$FILES"

echo ""
echo "⚠️  ATTENTION: Ce script doit être exécuté manuellement car les remplacements sont complexes"
echo ""
echo "📋 Actions à faire manuellement:"
echo "1. Ajouter en haut des fichiers: import { logger } from '@/lib/logger';"
echo "2. Remplacer:"
echo "   console.log(msg, data) → logger.info(msg, { data })"
echo "   console.error(msg, err) → logger.error(msg, { error: err })"
echo "   console.warn(msg) → logger.warn(msg)"
echo ""
echo "📝 Fichiers à modifier:"
echo "$FILES" | while read file; do
  count=$(grep -c "console\.\(log\|error\|warn\)" "$file" 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "   - $file ($count occurrences)"
  fi
done

echo ""
echo "✅ Pour automatiser, utilisez:"
echo "   npm install -g eslint eslint-plugin-no-console"
echo "   Puis configurez .eslintrc.json avec:"
echo '   "rules": { "no-console": ["error", { "allow": ["warn", "error"] }] }'



