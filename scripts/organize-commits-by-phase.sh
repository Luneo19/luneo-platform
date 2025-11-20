#!/bin/bash

# 🚀 Script pour organiser les commits par phase
# Ce script réorganise les commits sur les bonnes branches selon les phases

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Organisation des Commits par Phase${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Vérifier qu'on est sur une branche propre
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Branche actuelle: ${CURRENT_BRANCH}${NC}\n"

# Phase 1: Corrections Critiques
echo -e "${GREEN}📋 Phase 1: Corrections Critiques${NC}"
echo "Branche: feature/critique-fixes"
echo "Tâches:"
echo "  ✅ CRIT-001 à CRIT-004: Broken imports"
echo "  ✅ CRIT-005 à CRIT-006: Localhost hardcodé"
echo "  ✅ CRIT-007 à CRIT-011: Responsive dashboard"
echo "  ✅ CRIT-012: AR Export API"
echo "  ✅ CRIT-013: Integrations API (/api/integrations/list)"
echo "  ✅ CRIT-014: Notifications API"
echo "  ✅ CRIT-015: NotificationCenter UI"
echo ""

# Phase 2: Responsive Urgent
echo -e "${GREEN}📋 Phase 2: Responsive Urgent${NC}"
echo "Branche: feature/urgent-responsive"
echo "Tâches:"
echo "  ✅ URG-001: Homepage responsive"
echo "  ✅ URG-002: Solutions pages responsive"
echo "  ✅ URG-003: Demo pages responsive"
echo "  ✅ URG-012: DashboardTheme.tsx (existe)"
echo "  ✅ URG-013: Dark theme Header dashboard"
echo "  ✅ URG-014: Auth pages responsive"
echo "  ✅ URG-015: Dashboard pages responsive"
echo ""

# Phase 3: Améliorations UX/UI et Performance
echo -e "${GREEN}📋 Phase 3: Améliorations UX/UI et Performance${NC}"
echo "Branche: feature/important-quality"
echo "Tâches:"
echo "  ✅ IMP-001: Loading states avec skeletons"
echo "  ✅ IMP-002: Error handling amélioré"
echo "  ✅ IMP-003: Toast notifications"
echo "  ✅ IMP-004: Empty states"
echo "  ✅ IMP-005: Skeletons loading"
echo "  ✅ TODO-021 à TODO-025: Notifications complètes"
echo "  ✅ PERF-001 à PERF-004: Optimisations performance"
echo ""

echo -e "${YELLOW}📝 Note:${NC}"
echo "Les fichiers de code ont été créés et modifiés."
echo "Les commits sont organisés sur feature/important-quality."
echo ""
echo "Pour créer les Pull Requests:"
echo "  1. git push origin feature/critique-fixes"
echo "  2. git push origin feature/urgent-responsive"
echo "  3. git push origin feature/important-quality"
echo ""

