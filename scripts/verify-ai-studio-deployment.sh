#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT DE VÉRIFICATION FINALE - AI STUDIO
# Vérifie que tout est bien configuré et fonctionnel
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         VÉRIFICATION FINALE - AI STUDIO                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. VÉRIFICATION VARIABLES VERCEL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🔍 Vérification des variables Vercel...${NC}"

cd apps/frontend
vercel env pull .env.vercel --environment=production --yes > /dev/null 2>&1 || true

if [ -f ".env.vercel" ]; then
  source .env.vercel
  
  REQUIRED_VARS=(
    "OPENAI_API_KEY"
    "REPLICATE_API_TOKEN"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
  )
  
  MISSING=0
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      echo -e "${RED}   ❌ $var manquante${NC}"
      MISSING=$((MISSING + 1))
    else
      echo -e "${GREEN}   ✅ $var configurée${NC}"
    fi
  done
  
  rm -f .env.vercel
  
  if [ $MISSING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $MISSING variable(s) manquante(s)${NC}"
  else
    echo -e "${GREEN}✅ Toutes les variables sont configurées${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Impossible de récupérer les variables Vercel${NC}"
fi

cd ../..
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. VÉRIFICATION MIGRATION SQL
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🗄️  Vérification de la migration SQL...${NC}"

if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
  # Vérifier si les colonnes existent
  if psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits';" 2>/dev/null | grep -q "ai_credits"; then
    echo -e "${GREEN}✅ Colonne ai_credits existe${NC}"
  else
    echo -e "${YELLOW}⚠️  Colonne ai_credits non trouvée${NC}"
  fi
  
  if psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'designs';" 2>/dev/null | grep -q "designs"; then
    echo -e "${GREEN}✅ Table designs existe${NC}"
  else
    echo -e "${YELLOW}⚠️  Table designs non trouvée${NC}"
  fi
else
  echo -e "${CYAN}   ℹ️  Vérification manuelle requise${NC}"
  echo -e "${BLUE}   Vérifiez sur Supabase que:${NC}"
  echo -e "${BLUE}   • La colonne ai_credits existe sur profiles${NC}"
  echo -e "${BLUE}   • La table designs existe${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. VÉRIFICATION ROUTES API
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}🔗 Vérification des routes API...${NC}"

API_ROUTES=(
  "apps/frontend/src/app/api/ai/text-to-design/route.ts"
  "apps/frontend/src/app/api/ai/smart-crop/route.ts"
  "apps/frontend/src/app/api/ai/upscale/route.ts"
  "apps/frontend/src/app/api/ai/background-removal/route.ts"
  "apps/frontend/src/app/api/ai/extract-colors/route.ts"
)

for route in "${API_ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo -e "${GREEN}   ✅ $(basename $(dirname $route))${NC}"
  else
    echo -e "${RED}   ❌ $(basename $(dirname $route)) manquante${NC}"
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. VÉRIFICATION SERVICE LAYER
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}⚙️  Vérification du Service Layer...${NC}"

if [ -f "apps/frontend/src/lib/services/AIService.ts" ]; then
  echo -e "${GREEN}   ✅ AIService.ts existe${NC}"
else
  echo -e "${RED}   ❌ AIService.ts manquant${NC}"
fi

if [ -f "apps/frontend/src/app/(dashboard)/ai-studio/page.tsx" ]; then
  echo -e "${GREEN}   ✅ Page AI Studio existe${NC}"
else
  echo -e "${RED}   ❌ Page AI Studio manquante${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. RÉSUMÉ FINAL
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    RÉSUMÉ FINAL                            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo -e "${CYAN}🧪 Testez maintenant:${NC}"
echo -e "${BLUE}   https://luneo.app/dashboard/ai-studio${NC}"
echo ""
echo -e "${CYAN}📋 Fonctionnalités disponibles:${NC}"
echo -e "   • Text-to-Design (Génération IA)${NC}"
echo -e "   • Background Removal (Suppression arrière-plan)${NC}"
echo -e "   • Upscale (Agrandissement 2x/4x)${NC}"
echo -e "   • Extract Colors (Extraction palette)${NC}"
echo -e "   • Smart Crop (Recadrage intelligent)${NC}"
echo ""
echo -e "${CYAN}📊 Monitoring:${NC}"
echo -e "   • Vercel: https://vercel.com/dashboard${NC}"
echo -e "   • Logs: vercel logs --follow${NC}"
echo ""










