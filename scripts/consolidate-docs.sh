#!/bin/bash

# Script de consolidation de la documentation
# TODO-050: Merger fichiers redondants, supprimer doublons

set -e

echo "📚 CONSOLIDATION DE LA DOCUMENTATION - LUNEO PLATFORM"
echo ""

cd "$(dirname "$0")/.." || exit 1

DOCS_DIR="docs"
ROOT_DIR="."

# Créer le répertoire docs s'il n'existe pas
mkdir -p "$DOCS_DIR"

echo "🔍 Analyse des fichiers de documentation..."
echo ""

# Compter les fichiers MD à la racine
ROOT_MD_COUNT=$(find "$ROOT_DIR" -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')
DOCS_MD_COUNT=$(find "$DOCS_DIR" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Statistiques:"
echo "   - Fichiers MD à la racine: $ROOT_MD_COUNT"
echo "   - Fichiers MD dans docs/: $DOCS_MD_COUNT"
echo ""

# Identifier les fichiers redondants
echo "🔍 Identification des fichiers redondants..."
echo ""

# Fichiers à conserver dans docs/
KEEP_IN_DOCS=(
  "INDEX.md"
  "USER_GUIDE_COMPLETE.md"
  "ADMIN_GUIDE_COMPLETE.md"
  "SECURITY_AUDIT_COMPLETE.md"
  "PERFORMANCE_BUNDLE_ANALYSIS.md"
  "PERFORMANCE_IMAGE_OPTIMIZATION.md"
  "DESIGN_VERSIONING_SYSTEM.md"
  "DEPLOYMENT_CHECKLIST.md"
  "QUICK_START_DEPLOYMENT.md"
  "TESTING_GUIDE.md"
)

# Fichiers à conserver à la racine
KEEP_IN_ROOT=(
  "README.md"
  "CHANGELOG.md"
)

echo "✅ Fichiers à conserver dans docs/:"
for file in "${KEEP_IN_DOCS[@]}"; do
  echo "   - $file"
done

echo ""
echo "✅ Fichiers à conserver à la racine:"
for file in "${KEEP_IN_ROOT[@]}"; do
  echo "   - $file"
done

echo ""
echo "📝 Actions recommandées:"
echo ""
echo "1. Déplacer les fichiers de documentation vers docs/"
echo "2. Créer un INDEX.md avec liens vers tous les guides"
echo "3. Supprimer les fichiers redondants/obsolètes"
echo "4. Organiser par catégories:"
echo "   - docs/user/ : Guides utilisateur"
echo "   - docs/admin/ : Guides administrateur"
echo "   - docs/developer/ : Documentation développeur"
echo "   - docs/security/ : Documentation sécurité"
echo "   - docs/deployment/ : Guides déploiement"
echo ""

echo "⚠️  Note: Ce script ne modifie pas automatiquement les fichiers"
echo "   pour éviter la perte de données. Effectuez les actions manuellement."
echo ""

echo "📋 Liste des fichiers MD à la racine (à examiner):"
find "$ROOT_DIR" -maxdepth 1 -name "*.md" -type f | while read -r file; do
  filename=$(basename "$file")
  if [[ ! " ${KEEP_IN_ROOT[@]} " =~ " ${filename} " ]]; then
    echo "   - $filename"
  fi
done

echo ""
echo "✅ Consolidation terminée !"

