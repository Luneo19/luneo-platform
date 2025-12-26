#!/bin/bash

# Script de nettoyage des fichiers temporaires/obsolètes
# Usage: ./scripts/cleanup-temp-files.sh [--dry-run]

set -e

DRY_RUN=${1:-"--dry-run"}

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Nettoyage des fichiers temporaires/obsolètes${NC}"
echo ""

# Fichiers à GARDER (ne jamais supprimer)
KEEP_FILES=(
  "README.md"
  "SETUP.md"
  "ARCHITECTURE.md"
  "CONTRIBUTING.md"
  "QUICK_START.md"
  "PROFESSIONNALISATION_COMPLETE.md"
  "ROADMAP_COMPLET.md"
  "FINAL_REPORT.md"
  "DOCUMENTATION_INDEX.md"
  "CLEANUP_PLAN.md"
  "CLEANUP_SUMMARY.md"
  "CLEANUP_READY.md"
  "CLEANUP_COMPLETE.md"
  "PHASE1_BILAN.md"
  "PHASE2_BILAN.md"
  "PHASE3_BILAN.md"
  "PHASE4_BILAN.md"
  "PHASE5_BILAN.md"
  "PHASE1_RAPPORT_COVERAGE.md"
  "MONITORING_GUIDE.md"
  "MONITORING_AUDIT.md"
  "SECURITY_AUDIT.md"
  "DOCUMENTATION_AUDIT.md"
)

# Patterns de fichiers à SUPPRIMER
DELETE_PATTERNS=(
  "DEPLOIEMENT_*.md"
  "REBUILD_*.md"
  "CORRECTION_*.md"
  "SOLUTION_*.md"
  "RAPPORT_*.md"
  "RESUME_*.md"
  "AUDIT_*.md"
  "ACTIONS_*.md"
  "INSTRUCTIONS_*.md"
  "GUIDE_*.md"
  "CONFIGURATION_*.md"
  "DIAGNOSTIC_*.md"
  "PROBLEME_*.md"
  "STATUT_*.md"
  "STATUS_*.md"
  "PHASE1_*.md"
  "PHASE2_*.md"
  "PHASE3_*.md"
  "PHASE4_*.md"
  "PHASE5_*.md"
  "CORRECTIONS_*.md"
  "FINALISATION_*.md"
  "FINAL_STATUS_*.md"
  "OAUTH_*.md"
  "PAGE_*.md"
  "POINT_*.md"
  "README_*.md"
  "ROADMAP_*.md"
  "SOLUTIONS_*.md"
  "SUCCES_*.md"
  "SYNTHESE_*.md"
  "WEBHOOK_*.md"
  "HOMEPAGE_*.md"
  "SQL_*.md"
  "START_*.md"
  "OPTIMISATION_*.md"
)

# Fonction pour vérifier si un fichier doit être gardé
should_keep() {
  local file=$1
  for keep in "${KEEP_FILES[@]}"; do
    if [[ "$file" == "$keep" ]]; then
      return 0
    fi
  done
  return 1
}

# Fonction pour vérifier si un fichier doit être supprimé
should_delete() {
  local file=$1
  
  # Ne jamais supprimer les fichiers à garder
  if should_keep "$file"; then
    return 1
  fi
  
  # Vérifier les patterns
  for pattern in "${DELETE_PATTERNS[@]}"; do
    if [[ "$file" == $pattern ]]; then
      return 0
    fi
  done
  
  return 1
}

# Collecter les fichiers à supprimer
FILES_TO_DELETE=()

while IFS= read -r -d '' file; do
  filename=$(basename "$file")
  if should_delete "$filename"; then
    FILES_TO_DELETE+=("$file")
  fi
done < <(find . -maxdepth 1 -name "*.md" -type f -print0)

# Afficher les résultats
echo -e "${YELLOW}Fichiers à supprimer: ${#FILES_TO_DELETE[@]}${NC}"
echo ""

if [ ${#FILES_TO_DELETE[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ Aucun fichier à supprimer${NC}"
  exit 0
fi

# Afficher la liste
echo -e "${YELLOW}Liste des fichiers à supprimer:${NC}"
for file in "${FILES_TO_DELETE[@]}"; do
  echo "  - $file"
done
echo ""

# Demander confirmation si pas en dry-run
if [ "$DRY_RUN" != "--dry-run" ]; then
  if [ "$DRY_RUN" == "--yes" ]; then
    # Mode non-interactif avec --yes
    confirm="yes"
  else
    read -p "Voulez-vous supprimer ces fichiers? (yes/no): " confirm
  fi
  
  if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Annulé${NC}"
    exit 0
  fi
  
  # Supprimer les fichiers
  deleted_count=0
  for file in "${FILES_TO_DELETE[@]}"; do
    if rm "$file" 2>/dev/null; then
      echo -e "${GREEN}✅ Supprimé: $file${NC}"
      ((deleted_count++))
    else
      echo -e "${RED}❌ Erreur lors de la suppression: $file${NC}"
    fi
  done
  
  echo ""
  echo -e "${GREEN}✅ Nettoyage terminé! ${deleted_count}/${#FILES_TO_DELETE[@]} fichiers supprimés${NC}"
else
  echo -e "${YELLOW}Mode dry-run - Aucun fichier n'a été supprimé${NC}"
  echo "Pour supprimer réellement, exécutez: ./scripts/cleanup-temp-files.sh --yes"
fi

