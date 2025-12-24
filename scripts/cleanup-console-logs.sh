#!/bin/bash

# 🧹 Script de cleanup - Retire console.log de debug
# Garde console.error et console.warn pour les erreurs importantes

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Cleanup Console.log${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

FRONTEND_DIR="apps/frontend/src"

# Compter avant
BEFORE=$(grep -r "console\.log(" "$FRONTEND_DIR" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${YELLOW}Console.log trouvés avant: $BEFORE${NC}\n"

# Retirer console.log mais garder console.error et console.warn
echo -e "${GREEN}Nettoyage en cours...${NC}"

# Utiliser find avec sed pour retirer les lignes contenant uniquement console.log
find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -exec grep -l "console\.log(" {} \; | while read file; do
  # Retirer les lignes qui contiennent uniquement console.log (pas console.error/warn)
  # Utiliser une approche plus sûre: commenter au lieu de supprimer
  sed -i.bak 's/console\.log(/\/\/ console.log(/g' "$file" 2>/dev/null || true
  # Nettoyer les backups
  find "$FRONTEND_DIR" -name "*.bak" -delete 2>/dev/null || true
done

# Compter après
AFTER=$(grep -r "console\.log(" "$FRONTEND_DIR" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
REMOVED=$((BEFORE - AFTER))

echo -e "${GREEN}✅ Cleanup terminé${NC}"
echo -e "${BLUE}Console.log retirés: $REMOVED${NC}"
echo -e "${BLUE}Console.error conservés: $(grep -r "console\.error" "$FRONTEND_DIR" 2>/dev/null | wc -l | tr -d ' ')${NC}"
echo ""

