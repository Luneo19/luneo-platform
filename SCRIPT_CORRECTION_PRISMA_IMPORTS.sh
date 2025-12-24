#!/bin/bash

##############################################################################
# Script pour corriger tous les imports PrismaClient directs
# Remplace "new PrismaClient()" par l'import depuis @/lib/db
##############################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Correction des imports PrismaClient${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Liste des fichiers à corriger
FILES=(
  "src/lib/trpc/routers/order.ts"
  "src/lib/trpc/routers/product.ts"
  "src/lib/trpc/routers/ai.ts"
  "src/lib/trpc/routers/analytics.ts"
  "src/lib/trpc/routers/ar.ts"
  "src/lib/trpc/routers/customization.ts"
  "src/lib/trpc/routers/profile.ts"
  "src/lib/trpc/routers/design.ts"
  "src/lib/trpc/routers/library.ts"
  "src/lib/trpc/routers/team.ts"
  "src/lib/trpc/routers/admin.ts"
  "src/lib/trpc/routers/billing.ts"
  "src/lib/trpc/routers/ab-testing.ts"
  "src/lib/services/AnalyticsService.ts"
  "src/lib/services/NotificationService.ts"
  "src/lib/services/ProductionService.ts"
  "src/lib/services/PODMappingService.ts"
  "src/lib/services/IntegrationService.ts"
  "src/lib/services/ARAnalyticsService.ts"
  "src/lib/services/AdminService.ts"
  "src/lib/services/BillingService.ts"
  "src/lib/analytics/AdvancedAnalytics.ts"
  "src/lib/monitoring/health-check.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ] && grep -q "new PrismaClient" "$file" 2>/dev/null; then
    echo -e "${YELLOW}Correction de: $file${NC}"
    
    # Remplacer l'import
    sed -i '' 's/import { PrismaClient } from '\''@\/prisma\/client'\'';/import { db } from '\''@\/lib\/db'\'';/g' "$file" 2>/dev/null || true
    
    # Remplacer la déclaration
    sed -i '' 's/const db = new PrismaClient();/\/\/ db importé depuis @\/lib\/db/g' "$file" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Corrigé${NC}"
  fi
done

echo ""
echo -e "${GREEN}✅ Toutes les corrections appliquées${NC}"
echo ""
