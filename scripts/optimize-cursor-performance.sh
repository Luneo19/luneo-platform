#!/bin/bash

# Script pour optimiser les performances de Cursor
# Supprime les fichiers inutiles qui ralentissent l'indexation

set -e

echo "🚀 Optimisation des performances Cursor..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Nettoyer les caches Next.js
echo -e "${YELLOW}📦 Nettoyage des caches Next.js...${NC}"
find . -type d -name ".next" -path "*/apps/*" -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✅ Caches Next.js nettoyés${NC}"

# 2. Nettoyer les fichiers de cache webpack volumineux
echo -e "${YELLOW}📦 Nettoyage des fichiers de cache webpack...${NC}"
find . -name "*.pack" -type f -delete 2>/dev/null || true
find . -name "*.pack.old" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✅ Fichiers de cache webpack nettoyés${NC}"

# 3. Nettoyer les fichiers tsbuildinfo
echo -e "${YELLOW}📦 Nettoyage des fichiers TypeScript build info...${NC}"
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✅ Fichiers TypeScript build info nettoyés${NC}"

# 4. Nettoyer le cache Turbo
echo -e "${YELLOW}📦 Nettoyage du cache Turbo...${NC}"
rm -rf .turbo/cache/* 2>/dev/null || true
echo -e "${GREEN}✅ Cache Turbo nettoyé${NC}"

# 5. Compter les fichiers markdown obsolètes (sans les supprimer automatiquement)
echo -e "${YELLOW}📊 Analyse des fichiers markdown...${NC}"
MD_COUNT=$(find . -name "*.md" -type f | wc -l | tr -d ' ')
ROOT_MD_COUNT=$(find . -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')
echo -e "${YELLOW}   Total fichiers markdown: ${MD_COUNT}${NC}"
echo -e "${YELLOW}   Fichiers markdown à la racine: ${ROOT_MD_COUNT}${NC}"

# 6. Afficher les fichiers volumineux
echo -e "${YELLOW}📊 Recherche des fichiers volumineux...${NC}"
LARGE_FILES=$(find . -type f -size +10M -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -10)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${RED}   Fichiers volumineux détectés:${NC}"
    echo "$LARGE_FILES" | while read file; do
        size=$(du -h "$file" 2>/dev/null | cut -f1)
        echo -e "   ${RED}- $file ($size)${NC}"
    done
else
    echo -e "${GREEN}   Aucun fichier volumineux détecté${NC}"
fi

# 7. Statistiques finales
echo ""
echo -e "${GREEN}✅ Optimisation terminée!${NC}"
echo ""
echo "📊 Statistiques:"
du -sh . 2>/dev/null | awk '{print "   Taille totale du projet: " $1}'
du -sh apps/ 2>/dev/null | awk '{print "   Taille du dossier apps/: " $1}' || true
du -sh node_modules/ 2>/dev/null | awk '{print "   Taille de node_modules/: " $1}' || true
du -sh .git/ 2>/dev/null | awk '{print "   Taille du dossier .git/: " $1}' || true

echo ""
echo -e "${YELLOW}💡 Recommandations:${NC}"
echo "   1. Redémarrer Cursor pour que les changements prennent effet"
echo "   2. Vérifier que .gitignore est à jour"
echo "   3. Considérer de déplacer les fichiers markdown obsolètes vers un dossier archive/"
echo "   4. Nettoyer régulièrement avec: bash scripts/optimize-cursor-performance.sh"










